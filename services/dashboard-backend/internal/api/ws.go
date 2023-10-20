package api

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/basemind-ai/monorepo/gen/go/ptesting/v1"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/dto"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/middleware"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/ptestingclient"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/repositories"
	"github.com/basemind-ai/monorepo/shared/go/apierror"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/lxzan/gws"
	"github.com/rs/zerolog/log"
	"net/http"
	"strings"
	"time"
)

const (
	applicationIDSessionKey    = "application"
	socketDeadline             = 15 * time.Second
	statusWSServerError        = 1011
	statusWSUnsupportedPayload = 1007
)

type logger struct{}

func (logger) Error(v ...any) {
	log.Error().Msg(fmt.Sprint(v...))
}

var upgrader = gws.NewUpgrader(&handler{}, &gws.ServerOption{
	ReadAsyncEnabled: true,
	CompressEnabled:  true,
	Logger:           logger{},
	Recovery:         gws.Recovery,
})

func createPromptTestRecord(
	ctx context.Context,
	promptRequestRecordID string,
	data *dto.PromptConfigTestDTO,
	responseContent string,
) (*string, error) {
	promptRequestRecordUUID, parseErr := db.StringToUUID(promptRequestRecordID)
	if parseErr != nil {
		return nil, parseErr
	}

	templateVariable, marshalErr := json.Marshal(data.TemplateVariables)
	if marshalErr != nil {
		return nil, fmt.Errorf("failed to marshal template variables: %w", marshalErr)
	}

	promptTestRecord, err := db.GetQueries().
		CreatePromptTestRecord(ctx, db.CreatePromptTestRecordParams{
			Name:                  data.Name,
			PromptRequestRecordID: *promptRequestRecordUUID,
			Response:              responseContent,
			VariableValues:        templateVariable,
		})

	if err != nil {
		return nil, fmt.Errorf("failed to create prompt test record: %w", err)
	}
	promptTestRecordID := db.UUIDToString(&promptTestRecord.ID)
	return &promptTestRecordID, nil
}

func createPayloadFromMessage(
	ctx context.Context,
	data *dto.PromptConfigTestDTO,
	msg *ptesting.PromptTestingStreamingPromptResponse,
	builder *strings.Builder,
) ([]byte, error) {
	payload := dto.PromptConfigTestResultDTO{
		Content:      &msg.Content,
		FinishReason: msg.FinishReason,
	}

	if msg.PromptRequestRecordId != nil {
		promptTestRecordID, err := createPromptTestRecord(
			ctx,
			*msg.PromptRequestRecordId,
			data,
			builder.String(),
		)
		if err != nil {
			return nil, err
		}
		payload.PromptTestRecordID = promptTestRecordID
	}

	return json.Marshal(payload)
}

func streamGRPCMessages(
	ctx context.Context,
	socket *gws.Conn,
	data *dto.PromptConfigTestDTO,
	responseChannel chan *ptesting.PromptTestingStreamingPromptResponse,
	errorChannel chan error,
) error {
	var builder strings.Builder

	for {
		select {
		case err := <-errorChannel:
			errorMessage := err.Error()
			finishReason := "error"
			data := dto.PromptConfigTestResultDTO{
				ErrorMessage: &errorMessage,
				FinishReason: &finishReason,
			}
			payload, marshalErr := json.Marshal(data)
			if marshalErr != nil {
				log.Error().Err(marshalErr).Msg("failed to marshal error payload")
				return fmt.Errorf("failed to marshal error payload: %w", marshalErr)
			}

			if writeErr := socket.WriteMessage(gws.OpcodeText, payload); writeErr != nil {
				log.Error().Err(writeErr).Msg("failed to write message")
				return fmt.Errorf("failed to write message: %w", writeErr)
			}
			return err

		case msg, isOpen := <-responseChannel:
			if !isOpen {
				return nil
			}

			if _, writeErr := builder.WriteString(msg.Content); writeErr != nil {
				log.Error().Err(writeErr).Msg("failed to write prompt content to write")
				return writeErr
			}

			payload, err := createPayloadFromMessage(ctx, data, msg, &builder)
			if err != nil {
				log.Error().Err(err).Msg("failed to create prompt test record")
				return err
			}

			if writeErr := socket.WriteMessage(gws.OpcodeText, payload); writeErr != nil {
				log.Error().Err(writeErr).Msg("failed to write message")
				return writeErr
			}

			if msg.FinishReason != nil {
				return nil
			}
		}
	}
}

func parseMessageData(
	message *gws.Message,
	applicationID pgtype.UUID,
) (*dto.PromptConfigTestDTO, error) {
	data := dto.PromptConfigTestDTO{}
	if deserializationErr := serialization.DeserializeJSON(message, &data); deserializationErr != nil {
		return nil, fmt.Errorf("failed to deserialize message: %w", deserializationErr)
	}

	if validationErr := validate.Struct(data); validationErr != nil {
		log.Error().Interface("data", data).Msg("data failed validation")
		return nil, fmt.Errorf("failed to validate message: %w", validationErr)
	}

	if data.PromptConfigID == nil {
		// if the frontend is testing a prompt config that does not exist yet, we have to create a provisional
		// prompt config.
		promptConfig, createErr := repositories.CreatePromptConfig(
			context.Background(),
			applicationID,
			dto.PromptConfigCreateDTO{
				Name:                   fmt.Sprintf("prompt config for test: %s", data.Name),
				ModelParameters:        data.ModelParameters,
				ModelType:              data.ModelType,
				ModelVendor:            data.ModelVendor,
				ProviderPromptMessages: data.ProviderPromptMessages,
				IsTest:                 true,
			},
		)
		if createErr != nil {
			return nil, fmt.Errorf("failed to create prompt config: %w", createErr)
		}
		data.PromptConfigID = &promptConfig.ID
	}
	return &data, nil
}

type handler struct {
	gws.BuiltinEventHandler
}

// OnOpen - handles websocket connections. Called each time a new websocket connection is established.
func (handler) OnOpen(socket *gws.Conn) {
	// We set a deadline to ensure inactive sockets are closed.
	_ = socket.SetDeadline(time.Now().Add(socketDeadline))
}

// OnPing - handles websocket pings. Called each time the frontend sends a ping via the websocket.
func (handler) OnPing(socket *gws.Conn, _ []byte) {
	// We reset the deadline, since we got a ping.
	_ = socket.SetDeadline(time.Now().Add(socketDeadline))
	_ = socket.WritePong(nil)
}

// OnMessage - handles websocket messages. Called each time the frontend sends a message via the websocket.
// The message is parsed, and the data it holds is sent to the api-gateway service via GRPC. The response from
// this service is in turn streamed via the websocket to the frontend.
func (handler) OnMessage(socket *gws.Conn, message *gws.Message) {
	defer func() {
		if err := message.Close(); err != nil {
			log.Error().Err(err).Msg("failed to close message")
		}
	}()
	if message.Data != nil && message.Data.Len() > 0 && message.Opcode == gws.OpcodeText {
		// We are retrieving the request context we passed into the socket session.
		value, exists := socket.Session().Load(applicationIDSessionKey)
		if !exists {
			log.Error().Msg("failed to load context from session")
			socket.WriteClose(statusWSServerError, []byte("invalid context"))
			return
		}
		applicationID := value.(pgtype.UUID)

		data, parseErr := parseMessageData(message, applicationID)
		if parseErr != nil {
			log.Error().Err(parseErr).Msg("failed to parse message data")
			socket.WriteClose(statusWSUnsupportedPayload, []byte("invalid context"))
			return
		}

		client := ptestingclient.GetClient()

		responseChannel := make(chan *ptesting.PromptTestingStreamingPromptResponse)
		errorChannel := make(chan error, 1)

		go client.StreamPromptTest(
			context.Background(),
			db.UUIDToString(&applicationID),
			data,
			responseChannel,
			errorChannel,
		)

		if streamErr := streamGRPCMessages(context.Background(), socket, data, responseChannel, errorChannel); streamErr != nil {
			socket.WriteClose(statusWSServerError, []byte(streamErr.Error()))
			return
		}
	}
}

// promptTestingWebsocketHandler - handles websocket connections to the prompt testing endpoint.
// The regular GET request is upgraded into a websocket connection.
// The socket then runs in a separate go routine that prevents GC.
// See the OnMessage receive of the handler above for the actual handling of websocket messages.
func promptTestingWebsocketHandler(w http.ResponseWriter, r *http.Request) {
	socket, err := upgrader.Upgrade(w, r)
	if err != nil {
		log.Error().Err(err).Msg("failed to upgrade connection")
		apierror.InternalServerError().Render(w, r)
		return
	}
	// we have to pass the request applicationID via the socket session storage, because the GWS library
	// does not expose another API for this purpose.
	// The GWS session storage is concurrency safe, and is unique per socket - so we can be certain
	// the ID is the same when retrieving it in the OnMessage receiver.
	applicationID := r.Context().Value(middleware.ApplicationIDContextKey).(pgtype.UUID)
	socket.Session().Store(applicationIDSessionKey, applicationID)
	go socket.ReadLoop()
}

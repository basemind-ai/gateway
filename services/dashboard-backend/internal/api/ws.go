package api

import (
	"context"
	"encoding/hex"
	"errors"
	"fmt"
	"github.com/basemind-ai/monorepo/gen/go/ptesting/v1"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/dto"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/middleware"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/ptestingclient"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/repositories"
	"github.com/basemind-ai/monorepo/shared/go/cryptoutils"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/db/models"
	"github.com/basemind-ai/monorepo/shared/go/exc"
	"github.com/basemind-ai/monorepo/shared/go/ptr"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/lxzan/gws"
	"github.com/rs/zerolog/log"
	"net/http"
	"runtime"
	"strings"
	"time"
	"unsafe"
)

const (
	ApplicationIDSessionKey    = "application"
	ProjectIDSessionKey        = "project"
	socketDeadline             = time.Minute
	StatusWSServerError        = 1011
	StatusWSUnsupportedPayload = 1007
)

// Socket - interface for the websocket connection.
// we use this interface to allow testing.
type Socket interface {
	WriteMessage(opcode gws.Opcode, payload []byte) error
}

// recoveryHandler - recover from panics in the websocket.
func recoveryHandler(_ gws.Logger) { // skipcq: TCV-001
	if e := recover(); e != nil { //nolint: revive
		const size = 64 << 10
		buf := make([]byte, size)
		buf = buf[:runtime.Stack(buf, false)]
		msg := *(*string)(unsafe.Pointer(&buf))
		log.Error().
			Interface("error", e).
			Msgf("recovered from panic in websocket: %s", msg)
	}
}

var upgrader = gws.NewUpgrader(&handler{}, &gws.ServerOption{
	ReadAsyncEnabled: true,
	CompressEnabled:  true,
	Recovery:         recoveryHandler,
})

type RequestIDs struct {
	ApplicationID pgtype.UUID
	ProjectID     pgtype.UUID
}

func ExtractIDS(session gws.SessionStorage) (*RequestIDs, error) {
	applicationIDValue, exists := session.Load(ApplicationIDSessionKey)
	if !exists {
		return nil, errors.New("application id not set in session")
	}

	projectIDValue, exists := session.Load(ProjectIDSessionKey)
	if !exists {
		return nil, errors.New("project id not set in session")
	}

	applicationID, ok := applicationIDValue.(pgtype.UUID)
	if !ok {
		return nil, errors.New("failed to extract application id from session")
	}

	projectID, ok := projectIDValue.(pgtype.UUID)
	if !ok {
		return nil, errors.New("failed to extract project id from session")
	}

	return &RequestIDs{
		ApplicationID: applicationID,
		ProjectID:     projectID,
	}, nil
}

// CreatePayloadFromMessage - creates the payload from the message.
// If the message contains a prompt request record ID, we create a prompt test record.
func CreatePayloadFromMessage(
	ctx context.Context,
	data *dto.PromptConfigTestDTO,
	msg *ptesting.PromptTestingStreamingPromptResponse,
	builder *strings.Builder,
) []byte {
	payload := dto.PromptConfigTestResultDTO{
		Content:      &msg.Content,
		FinishReason: msg.FinishReason,
	}

	isErr := msg.FinishReason != nil && *msg.FinishReason == "error"

	if isErr {
		log.Warn().Msg("stream ended due to an error. Check the api-gateway logs for more details")
	}

	promptRequestRecordID := ""
	if msg.PromptRequestRecordId != nil {
		promptRequestRecordID = *msg.PromptRequestRecordId
	}

	if promptRequestRecordID != "" {
		recordID := exc.MustResult(db.StringToUUID(promptRequestRecordID))
		promptTestRecord, createErr := db.GetQueries().
			CreatePromptTestRecord(ctx, models.CreatePromptTestRecordParams{
				PromptRequestRecordID: *recordID,
				Response:              builder.String(),
				VariableValues:        serialization.SerializeJSON(data.TemplateVariables),
			})
		if createErr == nil {
			payload.PromptTestRecordID = ptr.To(db.UUIDToString(&promptTestRecord.ID))
		} else if !isErr {
			log.Error().Err(createErr).Msg("failed to create prompt test record")
		}
	}

	return serialization.SerializeJSON(payload)
}

// StreamGRPCMessages - streams gRPC messages to the websocket.
func StreamGRPCMessages(
	ctx context.Context,
	socket Socket,
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

			log.Debug().Err(err).Msg("received error message from channel")

			payload := serialization.SerializeJSON(dto.PromptConfigTestResultDTO{
				ErrorMessage: &errorMessage,
				FinishReason: &finishReason,
			})

			if writeErr := socket.WriteMessage(gws.OpcodeText, payload); writeErr != nil {
				log.Error().Err(writeErr).Msg("failed to write message")
				return fmt.Errorf("failed to write message: %w", writeErr)
			}
			return err

		case msg, isOpen := <-responseChannel:
			if !isOpen {
				return nil
			}

			// We are building the response string from the prompt request and response.
			// WriteString always returns nil as an error, so we can safely ignore it.
			_, _ = builder.WriteString(msg.Content)

			payload := CreatePayloadFromMessage(ctx, data, msg, &builder)

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

// ParseMessageData - parses the websocket message data into a dto.PromptConfigTestDTO.
func ParseMessageData(
	message *gws.Message,
	applicationID pgtype.UUID,
) (*dto.PromptConfigTestDTO, error) {
	data := dto.PromptConfigTestDTO{}
	if deserializationErr := serialization.DeserializeJSON(message, &data); deserializationErr != nil {
		return nil, fmt.Errorf("failed to deserialize message: %w", deserializationErr)
	}
	log.Debug().Interface("data", data).Msg("received message")

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
				Name: fmt.Sprintf(
					"test config - %s - %s",
					time.Now().Format(time.RFC3339), hex.EncodeToString(cryptoutils.RandomBytes(8)),
				),
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
		log.Debug().Interface("promptConfig", promptConfig).Msg("created prompt config")
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
	exc.Must(socket.SetDeadline(time.Now().Add(socketDeadline)))
}

// OnPing - handles websocket pings. Called each time the frontend sends a ping via the websocket.
func (handler) OnPing(socket *gws.Conn, msg []byte) {
	// We reset the deadline, since we got a ping.
	log.Debug().Bytes("msg", msg).Msg("received ping")
	exc.Must(socket.SetDeadline(time.Now().Add(socketDeadline)))
	exc.Must(socket.WritePong(nil))
}

// OnMessage - handles websocket messages. Called each time the frontend sends a message via the websocket.
// The message is parsed, and the data it holds is sent to the api-gateway service via GRPC. The response from
// this service is in turn streamed via the websocket to the frontend.
func (h handler) OnMessage(socket *gws.Conn, message *gws.Message) {
	defer func() { exc.LogIfErr(message.Close(), "failed to close message") }()

	if message.Data != nil {
		if message.Data.String() == "ping" {
			handler.OnPing(h, socket, message.Bytes())
			return
		}

		// We are retrieving the applicationID from the session storage.
		requestIDs, extractionErr := ExtractIDS(socket.Session())
		if extractionErr != nil {
			log.Error().Err(extractionErr).Msg("failed to extract stored variables from ws session")
			socket.WriteClose(StatusWSServerError, []byte(extractionErr.Error()))
			return
		}

		data, parseErr := ParseMessageData(message, requestIDs.ApplicationID)
		if parseErr != nil {
			log.Error().Err(parseErr).Msg("failed to parse message data")
			socket.WriteClose(StatusWSUnsupportedPayload, []byte(parseErr.Error()))
			return
		}

		client := ptestingclient.GetClient()

		responseChannel := make(chan *ptesting.PromptTestingStreamingPromptResponse)
		errorChannel := make(chan error, 1)

		go client.StreamPromptTest(
			context.Background(),
			db.UUIDToString(&requestIDs.ProjectID),
			db.UUIDToString(&requestIDs.ApplicationID),
			data,
			responseChannel,
			errorChannel,
		)

		if streamErr := StreamGRPCMessages(context.Background(), socket, data, responseChannel, errorChannel); streamErr != nil {
			log.Error().Err(streamErr).Msg("closing socket due to upstream error")
			socket.WriteClose(StatusWSServerError, []byte(streamErr.Error()))
			return
		}
	}
}

// promptTestingWebsocketHandler - handles websocket connections to the prompt testing endpoint.
// The regular GET request is upgraded into a websocket connection.
// The socket then runs in a separate go routine that prevents GC.
// See the OnMessage receive of the handler above for the actual handling of websocket messages.
func promptTestingWebsocketHandler(w http.ResponseWriter, r *http.Request) {
	socket := exc.MustResult(upgrader.Upgrade(w, r))
	// we have to pass the request applicationID via the socket session storage, because the GWS library
	// does not expose another API for this purpose.
	// The GWS session storage is concurrency safe, and is unique per socket - so we can be certain
	// the projectID and applicationID are the same when retrieving it in the OnMessage receiver.
	projectID := r.Context().Value(middleware.ProjectIDContextKey).(pgtype.UUID)
	socket.Session().Store(ProjectIDSessionKey, projectID)

	applicationID := r.Context().Value(middleware.ApplicationIDContextKey).(pgtype.UUID)
	socket.Session().Store(ApplicationIDSessionKey, applicationID)

	go socket.ReadLoop()
}

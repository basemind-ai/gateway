package api

import (
	"context"
	"fmt"
	prompttesting "github.com/basemind-ai/monorepo/gen/go/prompt_testing/v1"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/dto"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/middleware"
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
	ContextKey                 = "context"
	SocketDeadline             = 15 * time.Second
	StatusWSServerError        = 1011
	StatusWSUnsupportedPayload = 1007
)

type logger struct{}

func (logger) Error(v ...any) {
	log.Error().Msg(fmt.Sprint(v...))
}

var upgrader = gws.NewUpgrader(&Handler{}, &gws.ServerOption{
	ReadAsyncEnabled: true,
	CompressEnabled:  true,
	Logger:           logger{},
	Recovery:         gws.Recovery,
})

func createPayloadFromMessage(
	ctx context.Context,
	data dto.PromptConfigTestDTO,
	msg *prompttesting.PromptTestingStreamingPromptResponse,
	builder *strings.Builder,
) (*dto.PromptConfigTestResultDTO, error) {
	payload := dto.PromptConfigTestResultDTO{
		Content:      &msg.Content,
		FinishReason: msg.FinishReason,
	}

	if msg.PromptRequestRecordId != nil {
		promptRequestRecordID, _ := db.StringToUUID(*msg.PromptRequestRecordId)

		promptTestRecord, err := db.GetQueries().
			CreatePromptTestRecord(ctx, db.CreatePromptTestRecordParams{
				Name:                  data.Name,
				PromptRequestRecordID: *promptRequestRecordID,
				Response:              builder.String(),
				VariableValues:        data.TemplateVariables,
			})

		if err != nil {
			return nil, fmt.Errorf("failed to create prompt test record: %w", err)
		}
		promptTestID := db.UUIDToString(&promptTestRecord.ID)
		payload.PromptTestRecordID = &promptTestID
	}

	return &payload, nil
}

func streamGRPCMessages(
	ctx context.Context,
	socket *gws.Conn,
	data dto.PromptConfigTestDTO,
	responseChannel chan *prompttesting.PromptTestingStreamingPromptResponse,
	errorChannel chan error,
) error {
	var builder strings.Builder

	for {
		select {
		case err := <-errorChannel:
			errorMessage := err.Error()
			finishReason := "error"
			payload := dto.PromptConfigTestResultDTO{
				ErrorMessage: &errorMessage,
				FinishReason: &finishReason,
			}

			if writeErr := socket.WriteMessage(gws.OpcodeText, payload.Render()); writeErr != nil {
				log.Error().Err(writeErr).Msg("failed to write message")
				return writeErr
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

			if writeErr := socket.WriteMessage(gws.OpcodeText, payload.Render()); writeErr != nil {
				log.Error().Err(writeErr).Msg("failed to write message")
				return writeErr
			}

			if msg.FinishReason != nil {
				return nil
			}
		}
	}
}

type Handler struct {
	gws.BuiltinEventHandler
}

// OnOpen - handles websocket connections. Called each time a new websocket connection is established.
func (Handler) OnOpen(socket *gws.Conn) {
	// We set a deadline to ensure inactive sockets are closed.
	_ = socket.SetDeadline(time.Now().Add(SocketDeadline))
}

// OnPing - handles websocket pings. Called each time the frontend sends a ping via the websocket.
func (Handler) OnPing(socket *gws.Conn, _ []byte) {
	// We reset the deadline, since we got a ping.
	_ = socket.SetDeadline(time.Now().Add(SocketDeadline))
	_ = socket.WritePong(nil)
}

// OnMessage - handles websocket messages. Called each time the frontend sends a message via the websocket.
// The message is parsed, and the data it holds is sent to the api-gateway service via GRPC. The response from
// this service is in turn streamed via the websocket to the frontend.
func (Handler) OnMessage(socket *gws.Conn, message *gws.Message) {
	defer func() {
		if err := message.Close(); err != nil {
			log.Error().Err(err).Msg("failed to close message")
		}
		socket.Session().Delete(ContextKey)
	}()

	// We are retrieving the request context we passed into the socket session.
	value, exists := socket.Session().Load(ContextKey)
	if !exists {
		log.Error().Msg("failed to load context from session")
		socket.WriteClose(StatusWSServerError, []byte("invalid context"))
		return
	}
	ctx := value.(context.Context)

	data := dto.PromptConfigTestDTO{}
	if deserializationErr := serialization.DeserializeJSON(message, &data); deserializationErr != nil {
		log.Error().Err(deserializationErr).Msg("failed to deserialize message")
		socket.WriteClose(StatusWSUnsupportedPayload, []byte(deserializationErr.Error()))
		return
	}

	if validationErr := validate.Struct(data); validationErr != nil {
		log.Error().Err(validationErr).Msg("failed to validate message")
		socket.WriteClose(StatusWSUnsupportedPayload, []byte(validationErr.Error()))
		return
	}

	applicationID := ctx.Value(middleware.ApplicationIDContextKey).(pgtype.UUID)
	client := grpcclient.GetClient()

	responseChannel := make(chan *prompttesting.PromptTestingStreamingPromptResponse)
	errorChannel := make(chan error, 1)

	go client.StreamPromptTest(
		ctx,
		db.UUIDToString(&applicationID),
		data,
		responseChannel,
		errorChannel,
	)

	if streamErr := streamGRPCMessages(ctx, socket, data, responseChannel, errorChannel); streamErr != nil {
		socket.WriteClose(StatusWSServerError, []byte(streamErr.Error()))
		return
	}
}

// PromptTestingWebsocketHandler - handles websocket connections to the prompt testing endpoint.
// The regular GET request is upgraded into a websocket connection.
// The socket then runs in a separate go routine that prevents GC.
// See the OnMessage receive of the handler above for the actual handling of websocket messages.
func PromptTestingWebsocketHandler(w http.ResponseWriter, r *http.Request) {
	socket, err := upgrader.Upgrade(w, r)
	if err != nil {
		log.Error().Err(err).Msg("failed to upgrade connection")
		apierror.InternalServerError().Render(w, r)
		return
	}
	// we have to pass the request context via the socket session storage, because the GWS library
	// does not expose another API for this purpose.
	// The GWS session storage is concurrency safe, and is unique per socket - so we can be certain
	// the context is the same when retrieving it in the OnMessage receiver.
	socket.Session().Store(ContextKey, r.Context())

	go func() {
		socket.ReadLoop()
	}()
}

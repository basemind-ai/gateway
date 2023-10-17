package api

import (
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/dto"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"github.com/lxzan/gws"
	"github.com/rs/zerolog/log"
	"net/http"
	"time"
)

const (
	PingInterval = 10 * time.Second
	PingWait     = 5 * time.Second
)

var upgrader = gws.NewUpgrader(&Handler{}, &gws.ServerOption{
	ReadAsyncEnabled: true,
	CompressEnabled:  true,
	Recovery:         gws.Recovery,
})

func setDeadline(socket *gws.Conn, duration time.Duration) {
	_ = socket.SetDeadline(time.Now().Add(duration))
}

type Handler struct {
	gws.BuiltinEventHandler
}

func (Handler) OnOpen(socket *gws.Conn) {
	setDeadline(socket, PingInterval+PingWait)
}

func (Handler) OnPing(socket *gws.Conn, _ []byte) {
	setDeadline(socket, PingInterval+PingWait)
	_ = socket.WritePong(nil)
}

func (Handler) OnMessage(socket *gws.Conn, message *gws.Message) {
	defer func() {
		if err := message.Close(); err != nil {
			log.Error().Err(err).Msg("failed to close message")
		}
	}()

	data := dto.PromptConfigTestDTO{}
	if deserializationErr := serialization.DeserializeJSON(message, &data); deserializationErr != nil {
		log.Error().Err(deserializationErr).Msg("failed to deserialize message")
	}

	if writeErr := socket.WriteMessage(message.Opcode, []byte("ok")); writeErr != nil {
		log.Error().Err(writeErr).Msg("failed to write message")
	}
}

func WebsocketHandler(w http.ResponseWriter, r *http.Request) {
	socket, err := upgrader.Upgrade(w, r)
	if err != nil {
		return
	}
	go func() {
		socket.ReadLoop()
	}()
}

type WebsocketServerConfig struct {
	Port int `env:"WEBSOCKET_PORT,required"`
}

package openai

import (
	openaiconnector "github.com/basemind-ai/monorepo/gen/go/openai/v1"
	"github.com/basemind-ai/monorepo/shared/go/exc"
	"github.com/rs/zerolog/log"
	"google.golang.org/grpc"
)

type Client struct {
	client openaiconnector.OpenAIServiceClient
}

func New(serverAddress string, opts ...grpc.DialOption) *Client {
	conn := exc.MustResult(grpc.Dial(serverAddress, opts...))
	log.Info().Msg("initialized OpenAI connector connection")
	return &Client{client: openaiconnector.NewOpenAIServiceClient(conn)}
}

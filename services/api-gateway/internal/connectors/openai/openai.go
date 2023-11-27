package openai

import (
	openaiconnector "github.com/basemind-ai/monorepo/gen/go/openai/v1"
	"github.com/basemind-ai/monorepo/shared/go/exc"
	"github.com/basemind-ai/monorepo/shared/go/grpcutils"
	"github.com/rs/zerolog/log"
	"google.golang.org/grpc"
)

// Client implements the OpenAI connector gRPC client.
type Client struct {
	client openaiconnector.OpenAIServiceClient
}

// New creates a new OpenAI connector client.
func New(serverAddress string, opts ...grpc.DialOption) *Client {
	conn := exc.MustResult(grpcutils.NewConnection(serverAddress, opts...))
	log.Info().Msg("initialized OpenAI connector connection")
	return &Client{client: openaiconnector.NewOpenAIServiceClient(conn)}
}

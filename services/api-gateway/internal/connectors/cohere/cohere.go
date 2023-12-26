package cohere

import (
	cohereconnector "github.com/basemind-ai/monorepo/gen/go/cohere/v1"
	"github.com/basemind-ai/monorepo/shared/go/exc"
	"github.com/basemind-ai/monorepo/shared/go/grpcutils"
	"github.com/rs/zerolog/log"
	"google.golang.org/grpc"
)

// Client implements the Cohere connector gRPC client.
type Client struct {
	client cohereconnector.CohereServiceClient
}

// New creates a new Cohere connector client.
func New(serverAddress string, opts ...grpc.DialOption) *Client {
	conn := exc.MustResult(grpcutils.NewConnection(serverAddress, opts...))
	log.Info().Msg("initialized Cohere connector connection")

	return &Client{client: cohereconnector.NewCohereServiceClient(conn)}
}

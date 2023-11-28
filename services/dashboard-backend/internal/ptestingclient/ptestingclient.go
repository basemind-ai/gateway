package ptestingclient

import (
	"context"
	"errors"
	"fmt"
	"github.com/basemind-ai/monorepo/gen/go/ptesting/v1"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/dto"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/repositories"
	"github.com/basemind-ai/monorepo/shared/go/config"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/exc"
	"github.com/basemind-ai/monorepo/shared/go/grpcutils"
	"github.com/basemind-ai/monorepo/shared/go/jwtutils"
	"github.com/rs/zerolog/log"
	"github.com/sethvargo/go-envconfig"
	"google.golang.org/grpc"
	"google.golang.org/grpc/metadata"
	"io"
	"time"
)

var client *Client

// SetClient - sets the PromptTesting gRPC client.
func SetClient(c *Client) {
	client = c
}

// GetClient - gets the PromptTesting gRPC client.
func GetClient() *Client {
	return exc.ReturnNotNil(client, "client not initialized")
}

type clientConfig struct {
	APIGatewayAddress string `env:"API_GATEWAY_ADDRESS,required"`
}

// Client - a handler client for the PromptTesting gRPC service.
type Client struct {
	GRPCServiceClient ptesting.PromptTestingServiceClient
}

// New - creates a new PromptTesting gRPC client.
func New(serverAddress string, opts ...grpc.DialOption) *Client {
	conn := exc.MustResult(grpcutils.NewConnection(serverAddress, opts...))
	log.Info().Msg("initialized PromptTesting connection")
	return &Client{GRPCServiceClient: ptesting.NewPromptTestingServiceClient(conn)}
}

// Init - initializes the PromptTesting gRPC client. This function is called once.
func Init(ctx context.Context, opts ...grpc.DialOption) {
	cfg := &clientConfig{}
	exc.Must(envconfig.Process(ctx, cfg), "failed to parse env")
	SetClient(New(cfg.APIGatewayAddress, opts...))
}

// StreamPromptTest - streams a prompt test to the PromptTesting gRPC service.
func (c *Client) StreamPromptTest( //nolint: revive
	ctx context.Context,
	projectID string,
	applicationID string,
	data *dto.PromptConfigTestDTO,
	responseChannel chan<- *ptesting.PromptTestingStreamingPromptResponse,
	errorChannel chan<- error,
) {
	apiKeyID := exc.MustResult(repositories.GetOrCreateApplicationInternalAPIKeyID(
		ctx,
		applicationID,
	))

	jwt := exc.MustResult(jwtutils.CreateJWT(
		time.Minute,
		[]byte(config.Get(ctx).JWTSecret),
		db.UUIDToString(apiKeyID),
	))

	contextWithMetadata := metadata.AppendToOutgoingContext(
		ctx,
		"authorization",
		fmt.Sprintf("bearer %s", jwt),
	)

	testRequest := &ptesting.PromptTestRequest{
		ProjectId:              projectID,
		ApplicationId:          applicationID,
		PromptConfigId:         *data.PromptConfigID,
		ModelVendor:            string(data.ModelVendor),
		ModelType:              string(data.ModelType),
		ModelParameters:        *data.ModelParameters,
		ProviderPromptMessages: *data.ProviderPromptMessages,
		TemplateVariables:      data.TemplateVariables,
	}

	stream, connectionErr := c.GRPCServiceClient.TestPrompt(
		contextWithMetadata,
		testRequest,
	)

	if connectionErr != nil {
		log.Error().Err(connectionErr).Msg("failed to create stream")
		errorChannel <- fmt.Errorf("failed to create stream: %w", connectionErr)

		close(responseChannel)
		close(errorChannel)

		return
	}

	for {
		msg, receiveErr := stream.Recv()

		if receiveErr != nil {
			if !errors.Is(receiveErr, io.EOF) {
				log.Debug().Err(receiveErr).Msg("received stream error")
				errorChannel <- fmt.Errorf("received stream error: %w", connectionErr)
			}

			close(responseChannel)
			close(errorChannel)

			break
		}

		responseChannel <- msg
	}
}

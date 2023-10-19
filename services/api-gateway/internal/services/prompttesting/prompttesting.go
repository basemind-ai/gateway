package prompttesting

import (
	"github.com/basemind-ai/monorepo/gen/go/ptesting/v1"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type PromptTestingServer struct {
	ptesting.UnimplementedPromptTestingServiceServer
}

func (server PromptTestingServer) TestPrompt(
	*ptesting.PromptTestRequest,
	ptesting.PromptTestingService_TestPromptServer,
) error {
	return status.Errorf(codes.Unimplemented, "method TestPrompt not implemented")
}

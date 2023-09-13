package service

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/basemind-ai/monorepo/gen/go/gateway/v1"
	"github.com/basemind-ai/monorepo/go-shared/db"
	"github.com/jackc/pgx/v5/pgtype"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type Server struct {
	gateway.UnimplementedAPIGatewayServiceServer
}

func New() gateway.APIGatewayServiceServer {
	return Server{}
}

func RetrievePromptConfig(appId pgtype.UUID, version *uint32) (db.PromptConfig, error) {
	if version != nil {
		return db.GetQueries().FindPromptConfigByAppId(context.Background(), db.FindPromptConfigByAppIdParams{
			ApplicationID: appId, Version: int32(*version),
		})
	}
	return db.GetQueries().FindPromptConfigByAppId(context.Background(), db.FindPromptConfigByAppIdParams{
		ApplicationID: appId, Version: -1,
	})
}

func PromptConfigCacheKey(projectId string, appId pgtype.UUID, version *uint32) string {
	if version != nil {
		return fmt.Sprintf("%s::%x::%d", projectId, appId.Bytes, *version)
	}
	return fmt.Sprintf("%s::%x::latest", projectId, appId.Bytes)
}

func (Server) RequestPromptConfig(ctx context.Context, request *gateway.PromptConfigRequest) (*gateway.PromptConfigResponse, error) {
	projectId := pgtype.UUID{}

	if idErr := projectId.Scan(request.ProjectId); idErr != nil {
		return nil, status.Errorf(codes.InvalidArgument, "error scanning project id: %v", idErr)
	}

	application, applicationQueryErr := db.GetQueries().FindApplicationByAppIdAndProjectId(ctx, db.FindApplicationByAppIdAndProjectIdParams{
		AppID: request.ApplicationId, ProjectID: projectId,
	})

	if applicationQueryErr != nil {
		return nil, status.Errorf(codes.Internal, "error querying application: %v", applicationQueryErr)
	}
	promptConfig, promptConfigQueryErr := RetrievePromptConfig(application.ID, request.ConfigVersion)

	if promptConfigQueryErr != nil {
		return nil, status.Errorf(codes.Internal, "error querying prompt config: %v", promptConfigQueryErr)
	}

	expectedPromptVariables := make(map[string]string)
	if unmarshalErr := json.Unmarshal(promptConfig.PromptTemplate, &expectedPromptVariables); unmarshalErr != nil {
		return nil, status.Errorf(codes.Internal, "error unmarshalling prompt template: %v", unmarshalErr)
	}

	return &gateway.PromptConfigResponse{
		ExpectedPromptVariables: expectedPromptVariables,
	}, nil
}

func (Server) RequestPrompt(context.Context, *gateway.PromptRequest) (*gateway.PromptResponse, error) {
	return nil, status.Errorf(codes.Unimplemented, "method RequestPrompt not implemented")
}
func (Server) RequestStreamingPrompt(*gateway.PromptRequest, gateway.APIGatewayService_RequestStreamingPromptServer) error {
	return status.Errorf(codes.Unimplemented, "method RequestStreamingPrompt not implemented")
}

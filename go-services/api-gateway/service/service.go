package service

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/basemind-ai/monorepo/gen/go/gateway/v1"
	"github.com/basemind-ai/monorepo/go-shared/db"
	"github.com/basemind-ai/monorepo/go-shared/rediscache"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/rs/zerolog/log"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"time"
)

type Server struct {
	gateway.UnimplementedAPIGatewayServiceServer
}

func New() gateway.APIGatewayServiceServer {
	return Server{}
}

func PromptConfigCacheKey(projectId string, appId pgtype.UUID, version *uint32) string {
	if version != nil {
		return fmt.Sprintf("%s::%x::%d", projectId, appId.Bytes, *version)
	}
	return fmt.Sprintf("%s::%x::latest", projectId, appId.Bytes)
}

func RetrievePromptConfig(ctx context.Context, projectId string, appId pgtype.UUID, version *uint32) (db.PromptConfig, error) {
	cacheKey := PromptConfigCacheKey(projectId, appId, version)
	cfg := db.PromptConfig{}

	if cachedValue := rediscache.GetCachedValue(ctx, cacheKey, &cfg); cachedValue != nil {
		return *cachedValue, nil
	}

	if version != nil {
		dbValue, queryErr := db.GetQueries().FindPromptConfigByAppId(context.Background(), db.FindPromptConfigByAppIdParams{
			ApplicationID: appId, Version: int32(*version),
		})
		if queryErr != nil {
			return cfg, queryErr
		}
		cfg = dbValue
	} else {
		dbValue, queryErr := db.GetQueries().FindPromptConfigByAppId(context.Background(), db.FindPromptConfigByAppIdParams{
			ApplicationID: appId, Version: -1,
		})
		if queryErr != nil {
			return cfg, queryErr
		}
		cfg = dbValue
	}

	go func() {
		if cacheErr := rediscache.SetCachedValue(ctx, cacheKey, time.Minute*5, &cfg); cacheErr != nil {
			log.Error().Err(cacheErr).Msg("error caching prompt config")
		}
	}()

	return cfg, nil
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
	promptConfig, promptConfigQueryErr := RetrievePromptConfig(ctx, request.ProjectId, application.ID, request.ConfigVersion)

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

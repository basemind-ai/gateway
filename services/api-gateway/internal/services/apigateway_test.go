package services_test

import (
	"context"
	"errors"
	"fmt"
	"github.com/basemind-ai/monorepo/e2e/factories"
	"github.com/basemind-ai/monorepo/gen/go/gateway/v1"
	openaiconnector "github.com/basemind-ai/monorepo/gen/go/openai/v1"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/dto"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/services"
	"github.com/basemind-ai/monorepo/shared/go/datatypes"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/grpcutils"
	"github.com/basemind-ai/monorepo/shared/go/jwtutils"
	"github.com/basemind-ai/monorepo/shared/go/testutils"
	"github.com/grpc-ecosystem/go-grpc-middleware/v2/interceptors/auth"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/assert"
	"google.golang.org/grpc"
	"google.golang.org/grpc/metadata"
	"io"
	"testing"
	"time"
)

func createRequestConfigurationDTO(
	t *testing.T,
	projectID pgtype.UUID,
) dto.RequestConfigurationDTO {
	t.Helper()
	application, _ := factories.CreateApplication(context.TODO(), projectID)
	promptConfig, _ := factories.CreatePromptConfig(
		context.TODO(),
		application.ID,
	)

	return dto.RequestConfigurationDTO{
		ApplicationIDString: db.UUIDToString(&application.ID),
		ApplicationID:       application.ID,
		PromptConfigID:      &promptConfig.ID,
		PromptConfigData: datatypes.PromptConfigDTO{
			ID:                        db.UUIDToString(&promptConfig.ID),
			Name:                      promptConfig.Name,
			ModelType:                 promptConfig.ModelType,
			ModelVendor:               promptConfig.ModelVendor,
			ModelParameters:           promptConfig.ModelParameters,
			ProviderPromptMessages:    promptConfig.ProviderPromptMessages,
			ExpectedTemplateVariables: promptConfig.ExpectedTemplateVariables,
			IsDefault:                 promptConfig.IsDefault,
			CreatedAt:                 promptConfig.CreatedAt.Time,
			UpdatedAt:                 promptConfig.UpdatedAt.Time,
		},
	}
}

type mockGatewayServerStream struct {
	grpc.ServerStream
	Ctx      context.Context
	Response *gateway.StreamingPromptResponse
	Error    error
}

func (m mockGatewayServerStream) Context() context.Context {
	if m.Ctx != nil {
		return m.Ctx
	}
	return context.TODO()
}

func (m mockGatewayServerStream) Send(response *gateway.StreamingPromptResponse) error {
	m.Response = response //nolint: all
	return m.Error
}

func createGatewayServiceClient(t *testing.T) gateway.APIGatewayServiceClient {
	t.Helper()
	listener := testutils.CreateTestGRPCServer[gateway.APIGatewayServiceServer](
		t,
		gateway.RegisterAPIGatewayServiceServer,
		services.APIGatewayServer{},
		// we are using the same auth middleware as we do on main.go in this test
		grpc.ChainUnaryInterceptor(
			auth.UnaryServerInterceptor(grpcutils.NewAuthHandler(JWTSecret).HandleAuth),
		),
		grpc.ChainStreamInterceptor(
			auth.StreamServerInterceptor(grpcutils.NewAuthHandler(JWTSecret).HandleAuth),
		),
	)
	return testutils.CreateTestGRPCClient[gateway.APIGatewayServiceClient](
		t,
		listener,
		gateway.NewAPIGatewayServiceClient,
	)
}

func TestAPIGatewayService(t *testing.T) {
	srv := services.APIGatewayServer{}
	project, _ := factories.CreateProject(context.Background())
	configuration := createRequestConfigurationDTO(t, project.ID)
	openaiService := createOpenAIService(t)
	requestConfigurationDTO := createRequestConfigurationDTO(t, project.ID)
	jwtToken, jwtCreateErr := jwtutils.CreateJWT(
		time.Minute,
		[]byte(JWTSecret),
		requestConfigurationDTO.ApplicationIDString,
	)
	assert.NoError(t, jwtCreateErr)

	t.Run("RequestPrompt", func(t *testing.T) {
		t.Run("returns response correctly", func(t *testing.T) {
			client := createGatewayServiceClient(t)
			cacheClient, mockRedis := createTestCache(
				t,
				requestConfigurationDTO.ApplicationIDString,
			)

			expectedResponseContent := "Response content"

			openaiService.Response = &openaiconnector.OpenAIPromptResponse{
				Content: expectedResponseContent,
			}

			expectedCacheValue, marshalErr := cacheClient.Marshal(requestConfigurationDTO)
			assert.NoError(t, marshalErr)

			mockRedis.ExpectGet(requestConfigurationDTO.ApplicationIDString).RedisNil()
			mockRedis.ExpectSet(requestConfigurationDTO.ApplicationIDString, expectedCacheValue, time.Hour/2).
				SetVal("OK")

			outgoingContext := metadata.AppendToOutgoingContext(
				context.TODO(),
				"authorization",
				fmt.Sprintf("bearer %s", jwtToken),
			)

			firstResponse, firstResponseErr := client.RequestPrompt(
				outgoingContext,
				&gateway.PromptRequest{
					TemplateVariables: map[string]string{"userInput": "abc"},
				},
			)
			assert.NoError(t, firstResponseErr)
			assert.Equal(t, expectedResponseContent, firstResponse.Content)

			mockRedis.ExpectGet(requestConfigurationDTO.ApplicationIDString).
				SetVal(string(expectedCacheValue))

			secondResponse, secondResponseErr := client.RequestPrompt(
				outgoingContext,
				&gateway.PromptRequest{
					TemplateVariables: map[string]string{"userInput": "abc"},
				},
			)
			assert.NoError(t, secondResponseErr)
			assert.Equal(t, expectedResponseContent, secondResponse.Content)
		})
		t.Run("return error when ApplicationIDContext is not set", func(t *testing.T) {
			_, err := srv.RequestPrompt(context.TODO(), nil)
			assert.Errorf(t, err, services.ErrorApplicationIDNotInContext)
		})

		t.Run("returns error when a default prompt config is not found", func(t *testing.T) {
			application, _ := factories.CreateApplication(context.TODO(), project.ID)
			applicationIDContext := context.WithValue(
				context.TODO(),
				grpcutils.ApplicationIDContextKey,
				db.UUIDToString(&application.ID),
			)
			_, err := srv.RequestPrompt(applicationIDContext, &gateway.PromptRequest{})

			assert.Errorf(t, err, "the application does not have an active prompt configuration")
		})

		t.Run(
			"returns error when a prompt config with a provided ID is not found",
			func(t *testing.T) {
				application, _ := factories.CreateApplication(
					context.TODO(),
					project.ID,
				)
				applicationIDContext := context.WithValue(
					context.TODO(),
					grpcutils.ApplicationIDContextKey,
					db.UUIDToString(&application.ID),
				)
				_, err := srv.RequestPrompt(
					applicationIDContext,
					&gateway.PromptRequest{PromptConfigId: &configuration.PromptConfigData.ID},
				)

				assert.Errorf(
					t,
					err,
					"the application does not have an active prompt configuration",
				)
			},
		)

		t.Run("returns error when template variables are not valid", func(t *testing.T) {
			applicationIDContext := context.WithValue(
				context.TODO(),
				grpcutils.ApplicationIDContextKey,
				configuration.ApplicationIDString,
			)
			_, err := srv.RequestPrompt(applicationIDContext, &gateway.PromptRequest{
				TemplateVariables: map[string]string{"name": "John"},
			})

			assert.Errorf(t, err, "missing template variable {userInput}")
		})
	})
	t.Run("RequestStreamingPrompt", func(t *testing.T) {
		t.Run("streams response correctly", func(t *testing.T) {
			client := createGatewayServiceClient(t)
			cacheClient, mockRedis := createTestCache(
				t,
				requestConfigurationDTO.ApplicationIDString,
			)

			finishReason := "done"

			openaiService.Stream = []*openaiconnector.OpenAIStreamResponse{
				{Content: "1"},
				{Content: "2"},
				{Content: "3", FinishReason: &finishReason},
			}

			expectedCacheValue, marshalErr := cacheClient.Marshal(requestConfigurationDTO)
			assert.NoError(t, marshalErr)

			mockRedis.ExpectGet(requestConfigurationDTO.ApplicationIDString).RedisNil()
			mockRedis.ExpectSet(requestConfigurationDTO.ApplicationIDString, expectedCacheValue, time.Hour/2).
				SetVal("OK")

			outgoingContext := metadata.AppendToOutgoingContext(
				context.TODO(),
				"authorization",
				fmt.Sprintf("bearer %s", jwtToken),
			)

			stream, streamErr := client.RequestStreamingPrompt(
				outgoingContext,
				&gateway.PromptRequest{
					TemplateVariables: map[string]string{"userInput": "abc"},
				},
			)
			assert.NoError(t, streamErr)

			chunks := make([]*gateway.StreamingPromptResponse, 0)

			for {
				chunk, receiveErr := stream.Recv()
				if receiveErr != nil {
					if !errors.Is(receiveErr, io.EOF) {
						assert.Failf(t, "Received unexpected error:", "%v", receiveErr)
					}

					break
				}
				chunks = append(chunks, chunk)
			}

			assert.Len(t, chunks, 4)
			assert.Equal(t, "1", chunks[0].Content)            //nolint: gosec
			assert.Equal(t, "2", chunks[1].Content)            //nolint: gosec
			assert.Equal(t, "3", chunks[2].Content)            //nolint: gosec
			assert.Equal(t, "done", *chunks[3].FinishReason)   //nolint: gosec
			assert.Equal(t, 1, int(*chunks[3].ResponseTokens)) //nolint: gosec
			assert.Equal(t, 16, int(*chunks[3].RequestTokens)) //nolint: gosec
		})

		t.Run("return error when ApplicationIDContext is not set", func(t *testing.T) {
			err := srv.RequestStreamingPrompt(nil, mockGatewayServerStream{})
			assert.Errorf(t, err, services.ErrorApplicationIDNotInContext)
		})

		t.Run("returns error when prompt config is not found", func(t *testing.T) {
			application, _ := factories.CreateApplication(context.TODO(), project.ID)
			applicationIDContext := context.WithValue(
				context.TODO(),
				grpcutils.ApplicationIDContextKey,
				db.UUIDToString(&application.ID),
			)
			err := srv.RequestStreamingPrompt(
				&gateway.PromptRequest{},
				mockGatewayServerStream{Ctx: applicationIDContext},
			)
			assert.Errorf(t, err, "the application does not have an active prompt configuration")
		})

		t.Run(
			"returns error when a prompt config with a provided ID is not found",
			func(t *testing.T) {
				application, _ := factories.CreateApplication(
					context.TODO(),
					project.ID,
				)
				applicationIDContext := context.WithValue(
					context.TODO(),
					grpcutils.ApplicationIDContextKey,
					db.UUIDToString(&application.ID),
				)
				err := srv.RequestStreamingPrompt(
					&gateway.PromptRequest{PromptConfigId: &configuration.PromptConfigData.ID},
					mockGatewayServerStream{Ctx: applicationIDContext},
				)

				assert.Errorf(
					t,
					err,
					"the application does not have an active prompt configuration",
				)
			},
		)

		t.Run("returns error when template variables are not valid", func(t *testing.T) {
			applicationIDContext := context.WithValue(
				context.TODO(),
				grpcutils.ApplicationIDContextKey,
				configuration.ApplicationIDString,
			)
			err := srv.RequestStreamingPrompt(&gateway.PromptRequest{
				TemplateVariables: map[string]string{"name": "John"},
			}, mockGatewayServerStream{Ctx: applicationIDContext})

			assert.Errorf(t, err, "missing template variable {userInput}")
		})
	})
}

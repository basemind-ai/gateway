package services_test

import (
	"context"
	"encoding/json"
	"errors"
	"github.com/basemind-ai/monorepo/e2e/factories"
	"github.com/basemind-ai/monorepo/gen/go/gateway/v1"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/dto"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/services"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/db/models"
	"github.com/stretchr/testify/assert"
	"testing"
)

func TestUtils(t *testing.T) { //nolint:revive
	project, _ := factories.CreateProject(context.TODO())
	application, _ := factories.CreateApplication(context.TODO(), project.ID)
	promptConfig, _ := factories.CreatePromptConfig(context.TODO(), application.ID)
	promptRequestRecord, _ := factories.CreatePromptRequestRecord(context.TODO(), promptConfig.ID)
	_ = factories.CreateProviderPricingModels(context.TODO())

	promptConfigID := db.UUIDToString(&promptConfig.ID)

	t.Run("RetrievePromptConfig", func(t *testing.T) {
		t.Run("retrieves a prompt config by ID", func(t *testing.T) {
			promptConfigDTO, err := services.RetrievePromptConfig(
				context.TODO(),
				application.ID,
				&promptConfigID,
			)
			assert.NoError(t, err)
			assert.Equal(t, db.UUIDToString(&promptConfig.ID), promptConfigID)
			assert.Equal(t, promptConfig.Name, promptConfigDTO.Name)
			assert.Equal(t, promptConfig.ModelType, promptConfigDTO.ModelType)
			assert.Equal(t, promptConfig.ModelVendor, promptConfigDTO.ModelVendor)
			assert.Equal(
				t,
				json.RawMessage(promptConfig.ModelParameters),
				promptConfigDTO.ModelParameters,
			)
			assert.Equal(
				t,
				json.RawMessage(promptConfig.ProviderPromptMessages),
				promptConfigDTO.ProviderPromptMessages,
			)
			assert.Equal(
				t,
				promptConfig.ExpectedTemplateVariables,
				promptConfigDTO.ExpectedTemplateVariables,
			)
			assert.Equal(t, promptConfig.IsDefault, promptConfigDTO.IsDefault)
			assert.Equal(t, promptConfig.CreatedAt.Time, promptConfigDTO.CreatedAt)
			assert.Equal(t, promptConfig.UpdatedAt.Time, promptConfigDTO.UpdatedAt)
		})
		t.Run("handles an invalid UUID", func(t *testing.T) {
			invalidUUID := "invalid-uuid"
			_, err := services.RetrievePromptConfig(
				context.TODO(),
				application.ID,
				&invalidUUID,
			)
			assert.Error(t, err)
		})
		t.Run("handles a missing row", func(t *testing.T) {
			missingUUID := "00000000-0000-0000-0000-000000000000"
			_, err := services.RetrievePromptConfig(
				context.TODO(),
				application.ID,
				&missingUUID,
			)
			assert.Error(t, err)
		})
		t.Run(
			"retrieves the default prompt config when no prompt config ID is provided",
			func(t *testing.T) {
				promptConfigDTO, err := services.RetrievePromptConfig(
					context.TODO(),
					application.ID,
					nil,
				)
				assert.NoError(t, err)
				assert.Equal(t, db.UUIDToString(&promptConfig.ID), promptConfigID)
				assert.Equal(t, promptConfig.Name, promptConfigDTO.Name)
				assert.Equal(t, promptConfig.ModelType, promptConfigDTO.ModelType)
				assert.Equal(t, promptConfig.ModelVendor, promptConfigDTO.ModelVendor)
				assert.Equal(
					t,
					json.RawMessage(promptConfig.ModelParameters),
					promptConfigDTO.ModelParameters,
				)
				assert.Equal(
					t,
					json.RawMessage(promptConfig.ProviderPromptMessages),
					promptConfigDTO.ProviderPromptMessages,
				)
				assert.Equal(
					t,
					promptConfig.ExpectedTemplateVariables,
					promptConfigDTO.ExpectedTemplateVariables,
				)
				assert.Equal(t, promptConfig.IsDefault, promptConfigDTO.IsDefault)
				assert.Equal(t, promptConfig.CreatedAt.Time, promptConfigDTO.CreatedAt)
				assert.Equal(t, promptConfig.UpdatedAt.Time, promptConfigDTO.UpdatedAt)
			},
		)
		t.Run("handles an error retrieving the default prompt config", func(t *testing.T) {
			newApplication, _ := factories.CreateApplication(context.TODO(), project.ID)
			_, err := services.RetrievePromptConfig(
				context.TODO(),
				newApplication.ID,
				nil,
			)
			assert.Error(t, err)
		})
	})

	t.Run("RetrieveProviderModelPricing", func(t *testing.T) {
		for _, modelType := range []models.ModelType{
			models.ModelTypeGpt432k, models.ModelTypeGpt4, models.ModelTypeGpt35Turbo, models.ModelTypeGpt35Turbo16k,
		} {
			assert.NotPanics(t, func() {
				services.RetrieveProviderModelPricing(context.TODO(),
					modelType,
					models.ModelVendorOPENAI,
				)
			})
		}

		t.Run("panic if model type is not supported", func(t *testing.T) {
			assert.Panics(t, func() {
				services.RetrieveProviderModelPricing(context.TODO(),
					models.ModelType("unsupported-model-type"),
					models.ModelVendor("openai"),
				)
			})
		})

		t.Run("panic if model vendor is not supported", func(t *testing.T) {
			assert.Panics(t, func() {
				services.RetrieveProviderModelPricing(context.TODO(),
					models.ModelType("davinci"),
					models.ModelVendor("unsupported-model-vendor"),
				)
			})
		})
	})

	t.Run("RetrieveRequestConfiguration", func(t *testing.T) {
		t.Run("retrieves a request configuration DTO", func(t *testing.T) {
			requestConfigurationDTO, err := services.RetrieveRequestConfiguration(
				context.TODO(),
				application.ID,
				&promptConfigID,
			)()
			assert.NoError(t, err)
			assert.Equal(
				t,
				promptConfigID,
				db.UUIDToString(&requestConfigurationDTO.PromptConfigID),
			)
			assert.Equal(t, promptConfig.Name, requestConfigurationDTO.PromptConfigData.Name)
			assert.Equal(
				t,
				promptConfig.ModelType,
				requestConfigurationDTO.PromptConfigData.ModelType,
			)
			assert.Equal(
				t,
				promptConfig.ModelVendor,
				requestConfigurationDTO.PromptConfigData.ModelVendor,
			)
			assert.Equal(
				t,
				json.RawMessage(promptConfig.ModelParameters),
				requestConfigurationDTO.PromptConfigData.ModelParameters,
			)
			assert.Equal(
				t,
				json.RawMessage(promptConfig.ProviderPromptMessages),
				requestConfigurationDTO.PromptConfigData.ProviderPromptMessages,
			)
			assert.Equal(
				t,
				promptConfig.ExpectedTemplateVariables,
				requestConfigurationDTO.PromptConfigData.ExpectedTemplateVariables,
			)
			assert.Equal(
				t,
				promptConfig.IsDefault,
				requestConfigurationDTO.PromptConfigData.IsDefault,
			)
			assert.Equal(
				t,
				promptConfig.CreatedAt.Time,
				requestConfigurationDTO.PromptConfigData.CreatedAt,
			)
			assert.Equal(
				t,
				promptConfig.UpdatedAt.Time,
				requestConfigurationDTO.PromptConfigData.UpdatedAt,
			)
		})
		t.Run("handles error for missing application", func(t *testing.T) {
			missingUUID, _ := db.StringToUUID("00000000-0000-0000-0000-000000000000")
			_, err := services.RetrieveRequestConfiguration(
				context.TODO(),
				*missingUUID,
				&promptConfigID,
			)()
			assert.Error(t, err)
		})
		t.Run("handles error for missing prompt config", func(t *testing.T) {
			missingUUID := "00000000-0000-0000-0000-000000000000"
			_, err := services.RetrieveRequestConfiguration(
				context.TODO(),
				application.ID,
				&missingUUID,
			)()
			assert.Error(t, err)
		})
	})

	t.Run("ValidateExpectedVariables", func(t *testing.T) {
		t.Run("all variables present returns nil", func(t *testing.T) {
			templateVariables := map[string]string{
				"var1": "value1",
				"var2": "value2",
				"var3": "value3",
			}
			expectedVariables := []string{"var1", "var2", "var3"}

			err := services.ValidateExpectedVariables(templateVariables, expectedVariables)

			assert.NoError(t, err)
		})

		t.Run("empty expected variables returns nil", func(t *testing.T) {
			templateVariables := map[string]string{
				"var1": "value1",
				"var2": "value2",
				"var3": "value3",
			}
			var expectedVariables []string

			err := services.ValidateExpectedVariables(templateVariables, expectedVariables)

			assert.NoError(t, err)
		})

		t.Run("empty template variables returns error", func(t *testing.T) {
			templateVariables := map[string]string{}
			expectedVariables := []string{"var1", "var2", "var3"}

			err := services.ValidateExpectedVariables(templateVariables, expectedVariables)

			assert.Error(t, err)
		})

		t.Run("missing variable returns error", func(t *testing.T) {
			templateVariables := map[string]string{
				"var1": "value1",
				"var2": "value2",
			}
			expectedVariables := []string{"var1", "var2", "var3"}

			err := services.ValidateExpectedVariables(templateVariables, expectedVariables)

			assert.Error(t, err)
		})
	})

	t.Run("StreamFromChannel", func(t *testing.T) {
		message1 := "Message 1"
		message2 := "Message 2"

		t.Run("should send messages to server stream", func(t *testing.T) {
			ctx := context.TODO()
			channel := make(chan dto.PromptResultDTO)
			streamServer := &mockGatewayServerStream{Ctx: ctx}
			var sentMessages []dto.PromptResultDTO

			messageFactory := func(result dto.PromptResultDTO) (dto.PromptResultDTO, bool) {
				sentMessages = append(sentMessages, result)
				return result, len(sentMessages) == 2
			}

			go func() {
				channel <- dto.PromptResultDTO{
					Content: &message1,
				}
				channel <- dto.PromptResultDTO{
					Content: &message2,
				}
				close(channel)
			}()

			err := services.StreamFromChannel(ctx, channel, streamServer, messageFactory)

			assert.NoError(t, err)
			assert.Equal(t, 2, len(sentMessages))
			assert.Equal(t, &message1, sentMessages[0].Content)
			assert.Equal(t, &message2, sentMessages[1].Content)
		})

		t.Run("should finish streaming when is finished flag is true", func(t *testing.T) {
			ctx := context.TODO()
			channel := make(chan dto.PromptResultDTO)
			streamServer := &mockGatewayServerStream{}
			var sentMessages []dto.PromptResultDTO

			messageFactory := func(result dto.PromptResultDTO) (dto.PromptResultDTO, bool) {
				sentMessages = append(sentMessages, result)
				return result, true
			}

			go func() {
				channel <- dto.PromptResultDTO{
					Content: &message1,
				}
				close(channel)
			}()

			err := services.StreamFromChannel(ctx, channel, streamServer, messageFactory)

			assert.NoError(t, err)
			assert.Equal(t, 1, len(sentMessages))
			assert.Equal(t, &message1, sentMessages[0].Content)
		})

		t.Run("should send messages to server stream", func(t *testing.T) {
			ctx := context.TODO()
			channel := make(chan dto.PromptResultDTO)
			streamServer := &mockGatewayServerStream{Ctx: ctx}
			var sentMessages []dto.PromptResultDTO

			messageFactory := func(result dto.PromptResultDTO) (dto.PromptResultDTO, bool) {
				sentMessages = append(sentMessages, result)
				return result, len(sentMessages) == 2
			}

			go func() {
				channel <- dto.PromptResultDTO{
					Content: &message1,
				}
				channel <- dto.PromptResultDTO{
					Content: &message2,
				}
				close(channel)
			}()

			err := services.StreamFromChannel(ctx, channel, streamServer, messageFactory)

			assert.NoError(t, err)
			assert.Equal(t, 2, len(sentMessages))
			assert.Equal(t, &message1, sentMessages[0].Content)
			assert.Equal(t, &message2, sentMessages[1].Content)
		})

		t.Run("should return nil when the channel is closed", func(t *testing.T) {
			ctx := context.TODO()
			channel := make(chan dto.PromptResultDTO)
			streamServer := &mockGatewayServerStream{Ctx: ctx}

			messageFactory := func(result dto.PromptResultDTO) (dto.PromptResultDTO, bool) {
				return result, false
			}

			close(channel)

			err := services.StreamFromChannel(ctx, channel, streamServer, messageFactory)

			assert.NoError(t, err)
		})

		t.Run("should return nil when the context is cancelled", func(t *testing.T) {
			ctx, cancel := context.WithCancel(context.Background())
			channel := make(chan dto.PromptResultDTO)
			streamServer := &mockGatewayServerStream{Ctx: ctx}

			messageFactory := func(result dto.PromptResultDTO) (dto.PromptResultDTO, bool) {
				return result, false
			}

			cancel()

			err := services.StreamFromChannel(ctx, channel, streamServer, messageFactory)

			assert.Equal(t, context.Canceled, err)
		})

		t.Run("should return error when sending message fails", func(t *testing.T) {
			ctx := context.TODO()
			channel := make(chan dto.PromptResultDTO)
			streamServer := &mockGatewayServerStream{Error: errors.New("failed to send message")}

			messageFactory := func(result dto.PromptResultDTO) (dto.PromptResultDTO, bool) {
				return result, false
			}

			go func() {
				channel <- dto.PromptResultDTO{
					Content: &message1,
				}
				close(channel)
			}()

			err := services.StreamFromChannel(ctx, channel, streamServer, messageFactory)

			assert.EqualError(t, err, "rpc error: code = Internal desc = failed to send message")
		})

		t.Run("should return error when result has error", func(t *testing.T) {
			ctx := context.TODO()
			channel := make(chan dto.PromptResultDTO)
			streamServer := &mockGatewayServerStream{}
			var sentMessages []dto.PromptResultDTO

			messageFactory := func(result dto.PromptResultDTO) (dto.PromptResultDTO, bool) {
				sentMessages = append(sentMessages, result)
				return result, false
			}

			go func() {
				channel <- dto.PromptResultDTO{
					Error: errors.New("error communicating with AI provider"),
				}
				close(channel)
			}()

			err := services.StreamFromChannel(ctx, channel, streamServer, messageFactory)

			assert.EqualError(
				t,
				err,
				"rpc error: code = Internal desc = error communicating with AI provider",
			)
		})

		t.Run("should send messages to server stream", func(t *testing.T) {
			ctx := context.TODO()
			channel := make(chan dto.PromptResultDTO)
			streamServer := &mockGatewayServerStream{Ctx: ctx}
			var sentMessages []dto.PromptResultDTO

			messageFactory := func(result dto.PromptResultDTO) (dto.PromptResultDTO, bool) {
				sentMessages = append(sentMessages, result)
				return result, len(sentMessages) == 2
			}

			go func() {
				channel <- dto.PromptResultDTO{
					Content: &message1,
				}
				channel <- dto.PromptResultDTO{
					Content: &message2,
				}
				close(channel)
			}()

			err := services.StreamFromChannel(ctx, channel, streamServer, messageFactory)

			assert.NoError(t, err)
			assert.Equal(t, 2, len(sentMessages))
			assert.Equal(t, &message1, sentMessages[0].Content)
			assert.Equal(t, &message2, sentMessages[1].Content)
		})

		t.Run("should finish streaming when request record is present", func(t *testing.T) {
			ctx := context.TODO()
			channel := make(chan dto.PromptResultDTO)
			streamServer := &mockGatewayServerStream{}
			var sentMessages []dto.PromptResultDTO

			messageFactory := func(result dto.PromptResultDTO) (dto.PromptResultDTO, bool) {
				sentMessages = append(sentMessages, result)
				return result, true
			}

			go func() {
				channel <- dto.PromptResultDTO{
					RequestRecord: promptRequestRecord,
				}
				close(channel)
			}()

			err := services.StreamFromChannel(ctx, channel, streamServer, messageFactory)

			assert.NoError(t, err)
			assert.Equal(t, 1, len(sentMessages))
			assert.Equal(t, promptRequestRecord, sentMessages[0].RequestRecord)
		})

		t.Run("should finish streaming when error is present", func(t *testing.T) {
			ctx := context.TODO()
			channel := make(chan dto.PromptResultDTO)
			streamServer := &mockGatewayServerStream{}
			var sentMessages []dto.PromptResultDTO

			messageFactory := func(result dto.PromptResultDTO) (dto.PromptResultDTO, bool) {
				sentMessages = append(sentMessages, result)
				return result, true
			}

			go func() {
				channel <- dto.PromptResultDTO{
					Error: assert.AnError,
				}
				close(channel)
			}()

			err := services.StreamFromChannel(ctx, channel, streamServer, messageFactory)

			assert.Equal(t, 1, len(sentMessages))
			assert.Error(t, err)
		})
	})

	t.Run("TestCreateAPIGatewayStreamMessage", func(t *testing.T) {
		t.Run("returns valid response object and boolean value", func(t *testing.T) {
			result := dto.PromptResultDTO{}
			msg, isFinished := services.CreateAPIGatewayStreamMessage(result)

			assert.NotNil(t, msg)
			assert.IsType(t, &gateway.StreamingPromptResponse{}, msg)
			assert.False(t, isFinished)
		})

		t.Run("set finish reason to error", func(t *testing.T) {
			result := dto.PromptResultDTO{
				Error: errors.New("an error occurred"),
			}
			msg, _ := services.CreateAPIGatewayStreamMessage(result)

			assert.NotNil(t, msg)
			assert.Equal(t, "error", *msg.FinishReason)
		})

		t.Run("set finish reason to done", func(t *testing.T) {
			result := dto.PromptResultDTO{
				RequestRecord: &models.PromptRequestRecord{},
			}
			msg, _ := services.CreateAPIGatewayStreamMessage(result)

			assert.NotNil(t, msg)
			assert.Equal(t, "done", *msg.FinishReason)
		})

		t.Run("finish reason is nil when request record is nil", func(t *testing.T) {
			result := dto.PromptResultDTO{}
			msg, _ := services.CreateAPIGatewayStreamMessage(result)

			assert.NotNil(t, msg)
			assert.Nil(t, msg.FinishReason)
		})

		t.Run("set finish reason to error when request record is nil", func(t *testing.T) {
			result := dto.PromptResultDTO{
				Error: errors.New("an error occurred"),
			}
			msg, _ := services.CreateAPIGatewayStreamMessage(result)

			assert.NotNil(t, msg)
			assert.Equal(t, "error", *msg.FinishReason)
		})
	})
}

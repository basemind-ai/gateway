package factories

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"github.com/basemind-ai/monorepo/shared/go/config"
	"github.com/basemind-ai/monorepo/shared/go/cryptoutils"
	"github.com/basemind-ai/monorepo/shared/go/db/models"
	"github.com/basemind-ai/monorepo/shared/go/exc"
	"github.com/basemind-ai/monorepo/shared/go/ptr"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"time"

	"github.com/basemind-ai/monorepo/shared/go/datatypes"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/jackc/pgx/v5/pgtype"
)

func RandomString(length int) string {
	b := make([]byte, length+2)
	_, _ = rand.Read(b)
	return fmt.Sprintf("%x", b)[2 : length+2]
}

func CreateOpenAIPromptMessages(
	systemMessage string,
	userMessage string,
	templateVariables *[]string,
) *json.RawMessage {
	msgs := []*datatypes.OpenAIPromptMessageDTO{{
		Content: &systemMessage,
		Role:    "system",
	}, {
		Role:              "user",
		Content:           &userMessage,
		TemplateVariables: templateVariables,
	}}
	return ptr.To(json.RawMessage(serialization.SerializeJSON(msgs)))
}

func CreateOpenAIModelParameters() *json.RawMessage {
	floatValue := float32(0)
	intValue := int32(0)

	modelParameters := serialization.SerializeJSON(datatypes.OpenAIModelParametersDTO{
		Temperature:      &floatValue,
		TopP:             &floatValue,
		MaxTokens:        &intValue,
		FrequencyPenalty: &floatValue,
		PresencePenalty:  &floatValue,
	})

	return ptr.To(json.RawMessage(modelParameters))
}

func CreateProject(ctx context.Context) (*models.Project, error) {
	project, projectCreateErr := db.GetQueries().CreateProject(ctx, models.CreateProjectParams{
		Name:        RandomString(10),
		Description: RandomString(30),
	})

	if projectCreateErr != nil {
		return nil, projectCreateErr
	}

	return &project, nil
}

func CreateUserAccount(ctx context.Context) (*models.UserAccount, error) {
	user, userCreateErr := db.GetQueries().CreateUserAccount(
		ctx,
		models.CreateUserAccountParams{
			DisplayName: "Moishe Zuchmir",
			Email:       fmt.Sprintf("%s@zuchmir.com", RandomString(10)),
			PhotoUrl:    "https://moishe.zuchmir.com",
			PhoneNumber: "1234567890",
			FirebaseID:  RandomString(10),
		},
	)

	if userCreateErr != nil {
		return nil, userCreateErr
	}

	return &user, nil
}

func CreateApplication(ctx context.Context, projectID pgtype.UUID) (*models.Application, error) {
	application, applicationCreateErr := db.GetQueries().
		CreateApplication(ctx, models.CreateApplicationParams{
			ProjectID:   projectID,
			Name:        RandomString(10),
			Description: RandomString(30),
		})

	if applicationCreateErr != nil {
		return nil, applicationCreateErr
	}

	return &application, nil
}

func CreateOpenAIPromptConfig(
	ctx context.Context,
	applicationID pgtype.UUID,
) (*models.PromptConfig, error) {
	systemMessage := "You are a helpful chat bot."
	userMessage := "This is what the user asked for: {userInput}"
	templateVariables := []string{"userInput"}

	modelParameters := CreateOpenAIModelParameters()

	promptMessages := CreateOpenAIPromptMessages(
		systemMessage,
		userMessage,
		&templateVariables,
	)

	promptConfig, promptConfigCreateErr := db.GetQueries().
		CreatePromptConfig(ctx, models.CreatePromptConfigParams{
			ModelType:                 models.ModelTypeGpt35Turbo,
			ModelVendor:               models.ModelVendorOPENAI,
			ModelParameters:           *modelParameters,
			ProviderPromptMessages:    *promptMessages,
			ExpectedTemplateVariables: []string{"userInput"},
			IsDefault:                 true,
			ApplicationID:             applicationID,
		})
	if promptConfigCreateErr != nil {
		return nil, promptConfigCreateErr
	}

	return &promptConfig, nil
}

func CreateCohereModelParameters() *json.RawMessage {
	floatValue := float32(0)
	uintValue := uint32(0)
	intValue := int32(0)

	modelParameters := serialization.SerializeJSON(datatypes.CohereModelParametersDTO{
		Temperature:      &floatValue,
		K:                &uintValue,
		P:                &floatValue,
		FrequencyPenalty: &floatValue,
		PresencePenalty:  &floatValue,
		MaxTokens:        &intValue,
	})
	return ptr.To(json.RawMessage(modelParameters))
}

func CreateCoherePromptConfig(
	ctx context.Context,
	applicationID pgtype.UUID,
) (*models.PromptConfig, error) {
	userMessage := "This is what the user asked for: {userInput}"
	templateVariables := []string{"userInput"}

	modelParameters := CreateCohereModelParameters()

	promptMessages := ptr.To(
		json.RawMessage(serialization.SerializeJSON(datatypes.CoherePromptMessageDTO{
			Content:           userMessage,
			TemplateVariables: &templateVariables,
		})),
	)

	promptConfig, promptConfigCreateErr := db.GetQueries().
		CreatePromptConfig(ctx, models.CreatePromptConfigParams{
			ModelType:                 models.ModelTypeCommand,
			ModelVendor:               models.ModelVendorCOHERE,
			ModelParameters:           *modelParameters,
			ProviderPromptMessages:    *promptMessages,
			ExpectedTemplateVariables: []string{"userInput"},
			IsDefault:                 true,
			ApplicationID:             applicationID,
		})

	if promptConfigCreateErr != nil {
		return nil, promptConfigCreateErr
	}

	return &promptConfig, nil
}

func CreatePromptRequestRecord(
	ctx context.Context,
	promptConfigID pgtype.UUID,
) (*models.PromptRequestRecord, error) {
	promptStartTime := time.Now()
	promptFinishTime := promptStartTime.Add(10 * time.Second)

	requestTokenCost := exc.MustResult(db.StringToNumeric("0.0000105"))
	responseTokenCost := exc.MustResult(db.StringToNumeric("0.000036"))
	promptRequestRecord, promptRequestRecordCreateErr := db.GetQueries().
		CreatePromptRequestRecord(ctx, models.CreatePromptRequestRecordParams{
			IsStreamResponse:   true,
			RequestTokens:      7,
			ResponseTokens:     18,
			RequestTokensCost:  *requestTokenCost,
			ResponseTokensCost: *responseTokenCost,
			StartTime:          pgtype.Timestamptz{Time: promptStartTime, Valid: true},
			FinishTime:         pgtype.Timestamptz{Time: promptFinishTime, Valid: true},
			DurationMs:         pgtype.Int4{Int32: 0, Valid: true},
			PromptConfigID:     promptConfigID,
		})
	if promptRequestRecordCreateErr != nil {
		return nil, promptRequestRecordCreateErr
	}

	return &promptRequestRecord, nil
}

func CreateApplicationInternalAPIKey(
	ctx context.Context,
	applicationID pgtype.UUID,
) (*models.ApiKey, error) {
	apiKey, err := db.GetQueries().CreateAPIKey(ctx, models.CreateAPIKeyParams{
		ApplicationID: applicationID,
		Name:          "_internal apiKey",
		IsInternal:    true,
	})

	if err != nil {
		return nil, err
	}

	return &apiKey, nil
}

func CreateProviderPricingModels(
	ctx context.Context,
) error {
	for _, modelType := range []struct {
		ModelType        models.ModelType
		ModelVendor      models.ModelVendor
		InputTokenPrice  string
		OutputTokenPrice string
		TokenUnitSize    int
	}{
		{
			ModelType:        models.ModelTypeGpt35Turbo,
			ModelVendor:      models.ModelVendorOPENAI,
			InputTokenPrice:  "0.0015",
			OutputTokenPrice: "0.002",
			TokenUnitSize:    1_000,
		},
		{
			ModelType:        models.ModelTypeGpt35Turbo16k,
			ModelVendor:      models.ModelVendorOPENAI,
			InputTokenPrice:  "0.003",
			OutputTokenPrice: "0.004",
			TokenUnitSize:    1_000,
		},
		{
			ModelType:        models.ModelTypeGpt4,
			ModelVendor:      models.ModelVendorOPENAI,
			InputTokenPrice:  "0.03",
			OutputTokenPrice: "0.006",
			TokenUnitSize:    1_000,
		},
		{
			ModelType:        models.ModelTypeGpt432k,
			ModelVendor:      models.ModelVendorOPENAI,
			InputTokenPrice:  "0.06",
			OutputTokenPrice: "0.012",
			TokenUnitSize:    1_000,
		},
		{
			ModelType:        models.ModelTypeCommand,
			ModelVendor:      models.ModelVendorCOHERE,
			InputTokenPrice:  "1.00",
			OutputTokenPrice: "2.00",
			TokenUnitSize:    1_000_000,
		},
		{
			ModelType:        models.ModelTypeCommandNightly,
			ModelVendor:      models.ModelVendorCOHERE,
			InputTokenPrice:  "1.00",
			OutputTokenPrice: "2.00",
			TokenUnitSize:    1_000_000,
		},
		{
			ModelType:        models.ModelTypeCommandLight,
			ModelVendor:      models.ModelVendorCOHERE,
			InputTokenPrice:  "0.30",
			OutputTokenPrice: "0.60",
			TokenUnitSize:    1_000_000,
		},
		{
			ModelType:        models.ModelTypeCommandLightNightly,
			ModelVendor:      models.ModelVendorCOHERE,
			InputTokenPrice:  "0.30",
			OutputTokenPrice: "0.60",
			TokenUnitSize:    1_000_000,
		},
	} {
		input, _ := db.StringToNumeric(modelType.InputTokenPrice)
		output, _ := db.StringToNumeric(modelType.OutputTokenPrice)

		_, err := db.GetQueries().
			CreateProviderModelPricing(ctx, models.CreateProviderModelPricingParams{
				ModelType:        modelType.ModelType,
				ModelVendor:      modelType.ModelVendor,
				InputTokenPrice:  *input,
				OutputTokenPrice: *output,
				ActiveFromDate:   pgtype.Date{Time: time.Now(), Valid: true},
				TokenUnitSize:    int32(modelType.TokenUnitSize),
			})

		if err != nil {
			return err
		}
	}

	return nil
}

func CreateProviderAPIKey(
	ctx context.Context,
	projectID pgtype.UUID,
	apiKey string,
	modelVendor models.ModelVendor,
) (models.ProviderKey, error) {
	return db.GetQueries().CreateProviderKey(
		ctx, models.CreateProviderKeyParams{
			ProjectID: projectID, EncryptedApiKey: cryptoutils.Encrypt(apiKey, config.Get(ctx).CryptoPassKey), ModelVendor: modelVendor,
		})
}

package factories

import (
	"context"
	"crypto/rand"
	"fmt"
	"github.com/basemind-ai/monorepo/shared/go/db/models"
	"github.com/basemind-ai/monorepo/shared/go/exc"
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
) []byte {
	msgs := []*datatypes.OpenAIPromptMessageDTO{{
		Content: &systemMessage,
		Role:    "system",
	}, {
		Role:              "user",
		Content:           &userMessage,
		TemplateVariables: templateVariables,
	}}
	return serialization.SerializeJSON(msgs)
}

func CreateModelParameters() []byte {
	modelParameters := serialization.SerializeJSON(map[string]float32{
		"temperature":       1,
		"top_p":             1,
		"max_tokens":        1,
		"presence_penalty":  1,
		"frequency_penalty": 1,
	})

	return modelParameters
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

func CreatePromptConfig(
	ctx context.Context,
	applicationID pgtype.UUID,
) (*models.PromptConfig, error) {
	systemMessage := "You are a helpful chat bot."
	userMessage := "This is what the user asked for: {userInput}"
	templateVariables := []string{"userInput"}

	modelParams := CreateModelParameters()

	promptMessages := CreateOpenAIPromptMessages(
		systemMessage,
		userMessage,
		&templateVariables,
	)

	promptConfig, promptConfigCreateErr := db.GetQueries().
		CreatePromptConfig(ctx, models.CreatePromptConfigParams{
			ModelType:                 models.ModelTypeGpt35Turbo,
			ModelVendor:               models.ModelVendorOPENAI,
			ModelParameters:           modelParams,
			ProviderPromptMessages:    promptMessages,
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
			IsStreamResponse:      true,
			RequestTokens:         7,
			ResponseTokens:        18,
			RequestTokensCost:     *requestTokenCost,
			ResponseTokensCost:    *responseTokenCost,
			StartTime:             pgtype.Timestamptz{Time: promptStartTime, Valid: true},
			FinishTime:            pgtype.Timestamptz{Time: promptFinishTime, Valid: true},
			StreamResponseLatency: pgtype.Int8{Int64: 0, Valid: true},
			PromptConfigID:        promptConfigID,
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
		InputTokenPrice  string
		OutputTokenPrice string
	}{
		{
			ModelType:        models.ModelTypeGpt35Turbo,
			InputTokenPrice:  "0.0015",
			OutputTokenPrice: "0.002",
		},
		{
			ModelType:        models.ModelTypeGpt35Turbo16k,
			InputTokenPrice:  "0.003",
			OutputTokenPrice: "0.004",
		},
		{
			ModelType:        models.ModelTypeGpt4,
			InputTokenPrice:  "0.03",
			OutputTokenPrice: "0.006",
		},
		{
			ModelType:        models.ModelTypeGpt432k,
			InputTokenPrice:  "0.06",
			OutputTokenPrice: "0.012",
		},
	} {
		input, _ := db.StringToNumeric(modelType.InputTokenPrice)
		output, _ := db.StringToNumeric(modelType.OutputTokenPrice)

		_, err := db.GetQueries().
			CreateProviderModelPricing(ctx, models.CreateProviderModelPricingParams{
				ModelType:        modelType.ModelType,
				ModelVendor:      models.ModelVendorOPENAI,
				InputTokenPrice:  *input,
				OutputTokenPrice: *output,
				ActiveFromDate:   pgtype.Date{Time: time.Now(), Valid: true},
				TokenUnitSize:    1000,
			})

		if err != nil {
			return err
		}
	}

	return nil
}

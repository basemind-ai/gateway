package factories

import (
	"context"
	"crypto/rand"
	"fmt"
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

func CreateProject(ctx context.Context) (*db.Project, error) {
	project, projectCreateErr := db.GetQueries().CreateProject(ctx, db.CreateProjectParams{
		Name:        RandomString(10),
		Description: RandomString(30),
	})

	if projectCreateErr != nil {
		return nil, projectCreateErr
	}

	return &project, nil
}

func CreateUserAccount(ctx context.Context) (*db.UserAccount, error) {
	user, userCreateErr := db.GetQueries().CreateUserAccount(
		ctx,
		db.CreateUserAccountParams{
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

func CreateApplication(ctx context.Context, projectID pgtype.UUID) (*db.Application, error) {
	application, applicationCreateErr := db.GetQueries().
		CreateApplication(ctx, db.CreateApplicationParams{
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
) (*db.PromptConfig, error) {
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
		CreatePromptConfig(ctx, db.CreatePromptConfigParams{
			ModelType:                 db.ModelTypeGpt35Turbo,
			ModelVendor:               db.ModelVendorOPENAI,
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
) (*db.PromptRequestRecord, error) {
	tokenCount := int32(10)
	promptStartTime := time.Now()
	promptFinishTime := promptStartTime.Add(10 * time.Second)

	promptRequestRecord, promptRequestRecordCreateErr := db.GetQueries().
		CreatePromptRequestRecord(ctx, db.CreatePromptRequestRecordParams{
			IsStreamResponse:      true,
			RequestTokens:         tokenCount,
			ResponseTokens:        tokenCount,
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
) (*db.ApiKey, error) {
	apiKey, err := db.GetQueries().CreateAPIKey(ctx, db.CreateAPIKeyParams{
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
		ModelType        db.ModelType
		InputTokenPrice  string
		OutputTokenPrice string
	}{
		{
			ModelType:        db.ModelTypeGpt35Turbo,
			InputTokenPrice:  "0.0015",
			OutputTokenPrice: "0.002",
		},
		{
			ModelType:        db.ModelTypeGpt35Turbo16k,
			InputTokenPrice:  "0.003",
			OutputTokenPrice: "0.004",
		},
		{
			ModelType:        db.ModelTypeGpt4,
			InputTokenPrice:  "0.03",
			OutputTokenPrice: "0.006",
		},
		{
			ModelType:        db.ModelTypeGpt432k,
			InputTokenPrice:  "0.06",
			OutputTokenPrice: "0.012",
		},
	} {
		input, _ := db.StringToNumeric(modelType.InputTokenPrice)
		output, _ := db.StringToNumeric(modelType.OutputTokenPrice)

		_, err := db.GetQueries().
			CreateProviderModelPricing(ctx, db.CreateProviderModelPricingParams{
				ModelType:        modelType.ModelType,
				ModelVendor:      db.ModelVendorOPENAI,
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

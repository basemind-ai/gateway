package factories

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"fmt"
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
) ([]byte, error) {
	msgs := []*datatypes.OpenAIPromptMessageDTO{{
		Content: &systemMessage,
		Role:    "system",
	}, {
		Role:              "user",
		Content:           &userMessage,
		TemplateVariables: templateVariables,
	}}
	promptMessages, marshalErr := json.Marshal(msgs)
	if marshalErr != nil {
		return nil, marshalErr
	}

	return promptMessages, nil
}

func CreateModelParameters() ([]byte, error) {
	modelParameters, marshalErr := json.Marshal(map[string]float32{
		"temperature":       1,
		"top_p":             1,
		"max_tokens":        1,
		"presence_penalty":  1,
		"frequency_penalty": 1,
	})
	if marshalErr != nil {
		return nil, marshalErr
	}

	return modelParameters, nil
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
	firebaseID := RandomString(10)
	user, userCreateErr := db.GetQueries().CreateUserAccount(ctx, firebaseID)

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

	modelParams, modelParamsCreateErr := CreateModelParameters()

	if modelParamsCreateErr != nil {
		return nil, modelParamsCreateErr
	}

	promptMessages, promptMessagesCreateErr := CreateOpenAIPromptMessages(
		systemMessage,
		userMessage,
		&templateVariables,
	)

	if promptMessagesCreateErr != nil {
		return nil, promptMessagesCreateErr
	}

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

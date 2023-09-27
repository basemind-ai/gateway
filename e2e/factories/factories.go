package factories

import (
	"context"
	"encoding/json"
	openaiconnector "github.com/basemind-ai/monorepo/gen/go/openai/v1"
	"github.com/basemind-ai/monorepo/shared/go/datatypes"
	"github.com/basemind-ai/monorepo/shared/go/db"
)

func CreatePromptMessages(systemMessage string, userMessage string) ([]byte, error) {
	s, createPromptSystemMessageErr := datatypes.CreatePromptTemplateMessage(make([]string, 0), map[string]interface{}{
		"content": systemMessage,
		"role":    openaiconnector.OpenAIMessageRole_OPEN_AI_MESSAGE_ROLE_SYSTEM,
	})
	if createPromptSystemMessageErr != nil {
		return nil, createPromptSystemMessageErr
	}
	u, createPromptUserMessageErr := datatypes.CreatePromptTemplateMessage([]string{"userInput"}, map[string]interface{}{
		"content": userMessage,
		"role":    openaiconnector.OpenAIMessageRole_OPEN_AI_MESSAGE_ROLE_USER,
	})
	if createPromptUserMessageErr != nil {
		return nil, createPromptUserMessageErr
	}

	promptMessages, marshalErr := json.Marshal([]datatypes.PromptTemplateMessage{
		*s, *u,
	})
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

func CreateApplicationPromptConfig(ctx context.Context) (*datatypes.ApplicationPromptConfig, string, error) {
	project, projectCreateErr := db.GetQueries().CreateProject(ctx, db.CreateProjectParams{
		Name:        "test",
		Description: "test",
	})

	if projectCreateErr != nil {
		return nil, "", projectCreateErr
	}

	systemMessage := "You are a helpful chat bot."
	userMessage := "This is what the user asked for: {userInput}"

	application, applicationCreateErr := db.GetQueries().CreateApplication(ctx, db.CreateApplicationParams{
		ProjectID:   project.ID,
		Name:        "test",
		Description: "test",
	})

	if applicationCreateErr != nil {
		return nil, "", applicationCreateErr
	}

	modelParams, modelParamsCreateErr := CreateModelParameters()

	if modelParamsCreateErr != nil {
		return nil, "", modelParamsCreateErr
	}

	promptMessages, promptMessagesCreateErr := CreatePromptMessages(systemMessage, userMessage)

	if promptMessagesCreateErr != nil {
		return nil, "", promptMessagesCreateErr
	}

	promptConfig, promptConfigCreateErr := db.GetQueries().CreatePromptConfig(ctx, db.CreatePromptConfigParams{
		ModelType:         db.ModelTypeGpt35Turbo,
		ModelVendor:       db.ModelVendorOPENAI,
		ModelParameters:   modelParams,
		PromptMessages:    promptMessages,
		TemplateVariables: []string{"userInput"},
		IsActive:          true,
		ApplicationID:     application.ID,
	})
	if promptConfigCreateErr != nil {
		return nil, "", promptConfigCreateErr
	}

	return &datatypes.ApplicationPromptConfig{
		ApplicationID:    db.UUIDToString(&application.ID),
		ApplicationData:  application,
		PromptConfigData: promptConfig,
	}, db.UUIDToString(&application.ID), nil
}

// Update prompt config name
package repositories_test

import (
	"encoding/json"
	"github.com/basemind-ai/monorepo/e2e/factories"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/dto"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"testing"
)

func TestPromptConfigRepository(t *testing.T) {
	t.Run("CreatePromptConfig", func(t *testing.T) {
		t.Run("creates prompt config", func(t *testing.T) {})
		t.Run("returns error if no default prompt config is set", func(t *testing.T) {})
		t.Run("returns error if failed to parse prompt messages", func(t *testing.T) {})
		t.Run("returns error if failed to create prompt config", func(t *testing.T) {})
	})

	t.Run("UpdateApplicationDefaultPromptConfig", func(t *testing.T) {
		t.Run("updates application default prompt config", func(t *testing.T) {})
		t.Run(
			"returns error if failed to update application default prompt config",
			func(t *testing.T) {},
		)
	})

	t.Run("UpdatePromptConfig", func(t *testing.T) {
		t.Run("updates prompt config", func(t *testing.T) {
			params, _ := json.Marshal(map[string]interface{}{"maxTokens": 100})
			newModelParameters := json.RawMessage(params)

			newName := "new name"
			newModelType := db.ModelTypeGpt4

			newSystemMessage := "Your role is {role}"
			newUserMessage := "Describe what it is to be a {role} in your experience"

			templateVariables := []string{"role"}
			msgs, _ := factories.CreateOpenAIPromptMessages(
				newSystemMessage, newUserMessage, &templateVariables,
			)
			serializedMessages, _ := json.Marshal(msgs)
			newPromptMessages := json.RawMessage(serializedMessages)

			testCases := []struct {
				Name string
				Dto  dto.PromptConfigUpdateDTO
			}{
				{
					Name: "updates prompt config name",
					Dto:  dto.PromptConfigUpdateDTO{Name: &newName},
				},
				{
					Name: "updates prompt config model type",
					Dto:  dto.PromptConfigUpdateDTO{ModelType: &newModelType},
				},
				{
					Name: "updates prompt config model parameters",
					Dto:  dto.PromptConfigUpdateDTO{ModelParameters: &newModelParameters},
				},
				{
					Name: "updates prompt config prompt messages",
					Dto:  dto.PromptConfigUpdateDTO{ProviderPromptMessages: &newPromptMessages},
				},
				{
					Name: "updates multiple values",
					Dto: dto.PromptConfigUpdateDTO{
						Name:                   &newName,
						ModelType:              &newModelType,
						ModelParameters:        &newModelParameters,
						ProviderPromptMessages: &newPromptMessages,
					},
				},
			}

			for _, testCase := range testCases {
				t.Run(testCase.Name, func(t *testing.T) {})
			}
		})
		t.Run("returns error if failed to retrieve prompt config", func(t *testing.T) {})
		t.Run("returns error if failed to parse prompt messages", func(t *testing.T) {})
	})
	t.Run("DeletePromptConfig", func(t *testing.T) {
		t.Run("deletes prompt config", func(t *testing.T) {})
		t.Run("returns error if failed to delete prompt config", func(t *testing.T) {})
	})
}

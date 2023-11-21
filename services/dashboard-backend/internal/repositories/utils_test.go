package repositories_test

import (
	"encoding/json"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/repositories"
	"github.com/basemind-ai/monorepo/shared/go/db/models"
	"github.com/basemind-ai/monorepo/shared/go/ptr"
	"github.com/stretchr/testify/assert"
	"testing"
)

func TestUtils(t *testing.T) {
	t.Run("ParsePromptMessages", func(t *testing.T) {
		t.Run("parses openai messages", func(t *testing.T) {
			promptMessages := ptr.To(json.RawMessage(
				`[{"role": "user", "content": "Hello {name}!"}, {"role": "system", "content": "You are a helpful chatbot."}]`,
			))
			vendor := models.ModelVendorOPENAI

			expectedVariables, parsedMessages, err := repositories.ParsePromptMessages(
				promptMessages,
				vendor,
			)

			assert.NoError(t, err)
			assert.Equal(t, []string{"name"}, expectedVariables)
			assert.NotEmpty(t, parsedMessages)
		})

		t.Run("de-duplicates template variables", func(t *testing.T) {
			promptMessages := ptr.To(json.RawMessage(
				`[{"role": "user", "content": "Hello {name}!"}, {"role": "system", "content": "You are a helpful {name}."}]`,
			))
			vendor := models.ModelVendorOPENAI

			expectedVariables, parsedMessages, err := repositories.ParsePromptMessages(
				promptMessages,
				vendor,
			)

			assert.NoError(t, err)
			assert.Equal(t, []string{"name"}, expectedVariables)
			assert.NotEmpty(t, parsedMessages)
		})

		t.Run("returns error for invalid JSON prompt message", func(t *testing.T) {
			promptMessages := ptr.To(json.RawMessage(`invalid`))

			_, _, err := repositories.ParsePromptMessages(promptMessages, models.ModelVendorOPENAI)
			assert.Error(t, err)
		})

		t.Run("returns error for invalid vendor", func(t *testing.T) {
			promptMessages := ptr.To(json.RawMessage(
				`[{"role": "user", "content": "Hello {name}!"}, {"role": "system", "content": "You are a helpful {name}."}]`,
			))
			vendor := models.ModelVendor("abc")
			_, _, err := repositories.ParsePromptMessages(promptMessages, vendor)
			assert.Error(t, err)
		})

		t.Run("returns error for invalid role", func(t *testing.T) {
			promptMessages := ptr.To(json.RawMessage(
				`[{"role": "x", "content": "Hello {name}!"}, {"role": "system", "content": "You are a helpful {name}."}]`,
			))
			vendor := models.ModelVendorOPENAI
			_, _, err := repositories.ParsePromptMessages(promptMessages, vendor)
			assert.Error(t, err)
		})

		t.Run("returns error for nil prompt messages", func(t *testing.T) {
			vendor := models.ModelVendorOPENAI

			expectedVariables, parsedMessages, err := repositories.ParsePromptMessages(
				nil,
				vendor,
			)

			assert.Error(t, err)
			assert.Nil(t, expectedVariables)
			assert.Nil(t, parsedMessages)
		})
	})
}

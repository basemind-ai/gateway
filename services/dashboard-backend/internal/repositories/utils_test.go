package repositories_test

import (
	"encoding/json"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/repositories"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/stretchr/testify/assert"
	"testing"
)

func TestUtils(t *testing.T) {
	t.Run("ParsePromptMessages", func(t *testing.T) {
		t.Run("parses openai messages", func(t *testing.T) {
			promptMessages := json.RawMessage(
				`[{"role": "user", "content": "Hello {name}!"}, {"role": "system", "content": "You are a helpful chatbot."}]`,
			)
			vendor := db.ModelVendorOPENAI

			expectedVariables, parsedMessages, err := repositories.ParsePromptMessages(
				promptMessages,
				vendor,
			)

			assert.NoError(t, err)
			assert.Equal(t, []string{"name"}, expectedVariables)
			assert.NotEmpty(t, parsedMessages)
		})

		t.Run("de-duplicates template variables", func(t *testing.T) {
			promptMessages := json.RawMessage(
				`[{"role": "user", "content": "Hello {name}!"}, {"role": "system", "content": "You are a helpful {name}."}]`,
			)
			vendor := db.ModelVendorOPENAI

			expectedVariables, parsedMessages, err := repositories.ParsePromptMessages(
				promptMessages,
				vendor,
			)

			assert.NoError(t, err)
			assert.Equal(t, []string{"name"}, expectedVariables)
			assert.NotEmpty(t, parsedMessages)
		})

		t.Run("returns error for invalid JSON prompt message", func(t *testing.T) {
			promptMessages := json.RawMessage(`invalid`)

			_, _, err := repositories.ParsePromptMessages(promptMessages, db.ModelVendorOPENAI)
			assert.Error(t, err)
		})

		t.Run("returns error for invalid vendor", func(t *testing.T) {
			promptMessages := json.RawMessage(
				`[{"role": "user", "content": "Hello {name}!"}, {"role": "system", "content": "You are a helpful {name}."}]`,
			)
			vendor := db.ModelVendor("abc")
			_, _, err := repositories.ParsePromptMessages(promptMessages, vendor)
			assert.Error(t, err)
		})

		t.Run("returns error for invalid role", func(t *testing.T) {
			promptMessages := json.RawMessage(
				`[{"role": "x", "content": "Hello {name}!"}, {"role": "system", "content": "You are a helpful {name}."}]`,
			)
			vendor := db.ModelVendorOPENAI
			_, _, err := repositories.ParsePromptMessages(promptMessages, vendor)
			assert.Error(t, err)
		})
	})
}

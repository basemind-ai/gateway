package utils_test

import (
	"context"
	"fmt"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/services"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/utils"
	"github.com/basemind-ai/monorepo/shared/go/db/models"
	"github.com/basemind-ai/monorepo/shared/go/testutils"
	"github.com/shopspring/decimal"
	"github.com/stretchr/testify/assert"
	"testing"
)

func TestMain(m *testing.M) {
	cleanup := testutils.CreateNamespaceTestDBModule("utils-test")
	defer cleanup()
	m.Run()
}

func TestUtils(t *testing.T) {
	t.Run("ParseTemplateVariables", func(t *testing.T) {
		t.Run("replaces all expected variables", func(t *testing.T) {
			content := "Hello {name}, your age is {age}. How are you {name}?"
			expectedVariables := []string{"name", "age"}
			templateVariables := map[string]string{"name": "John", "age": "30"}

			result, err := utils.ParseTemplateVariables(
				content,
				expectedVariables,
				templateVariables,
			)
			assert.NoError(t, err)

			expected := "Hello John, your age is 30. How are you John?"
			assert.Equal(t, expected, result)
		})
		t.Run(
			"returns the content string with no errors when there are no expected variables",
			func(t *testing.T) {
				content := "Hello {name}, your age is {age}. How are you {name}?"
				expectedVariables := make([]string, 0)
				templateVariables := map[string]string{"name": "John", "age": "30"}

				result, err := utils.ParseTemplateVariables(
					content,
					expectedVariables,
					templateVariables,
				)
				assert.NoError(t, err)

				assert.Equal(t, content, result)
			},
		)
		t.Run("returns an error when an expected variable is missing", func(t *testing.T) {
			content := "Hello {name}, your age is {age}."
			expectedVariables := []string{"name", "age"}
			templateVariables := map[string]string{"name": "John"}

			_, err := utils.ParseTemplateVariables(content, expectedVariables, templateVariables)
			assert.Error(t, err)

			expectedError := "missing template variable {age}"
			assert.Contains(t, err.Error(), expectedError)
		})
		t.Run("handles empty template variable", func(t *testing.T) {
			content := "Hello {name}, how are you?"
			expectedVariables := []string{"name"}
			templateVariables := map[string]string{"name": ""}

			result, err := utils.ParseTemplateVariables(
				content,
				expectedVariables,
				templateVariables,
			)
			assert.NoError(t, err)

			expected := "Hello , how are you?"
			assert.Equal(t, expected, result)
		})
	})

	t.Run("GetStringTokenCount", func(t *testing.T) {
		testCases := []struct {
			input    string
			expected int32
		}{
			{
				input:    "Hello world!",
				expected: 3,
			},
			{
				input:    "",
				expected: 0,
			},
			{
				input:    "Goodbye world!",
				expected: 4,
			},
		}

		for _, testCase := range testCases {
			t.Run(fmt.Sprintf("Test: '%d' token count", testCase.expected), func(t *testing.T) {
				count := utils.GetStringTokenCount(testCase.input, models.ModelTypeGpt35Turbo)
				assert.Equal(t, testCase.expected, count)
			})
		}
	})

	t.Run("CalculateTokenCountsAndCosts", func(t *testing.T) {
		promptInputValue := "you are a helpful chatbot."
		promptOutputValue := "trees are green, sky is blue, i am a machine, and so are you."
		expectedInputTokenCount := int32(7)
		expectedOutputTokenCount := int32(18)
		testCases := []struct {
			modelType               models.ModelType
			expectedInputTokenCost  decimal.Decimal
			expectedOutputTokenCost decimal.Decimal
		}{
			{
				modelType:               models.ModelTypeGpt35Turbo,
				expectedInputTokenCost:  decimal.RequireFromString("0.0000105"),
				expectedOutputTokenCost: decimal.RequireFromString("0.000036"),
			},
			{
				modelType:               models.ModelTypeGpt35Turbo16k,
				expectedInputTokenCost:  decimal.RequireFromString("0.000021"),
				expectedOutputTokenCost: decimal.RequireFromString("0.000072"),
			},
			{
				modelType:               models.ModelTypeGpt4,
				expectedInputTokenCost:  decimal.RequireFromString("0.00021"),
				expectedOutputTokenCost: decimal.RequireFromString("0.000108"),
			},
			{
				modelType:               models.ModelTypeGpt432k,
				expectedInputTokenCost:  decimal.RequireFromString("0.00042"),
				expectedOutputTokenCost: decimal.RequireFromString("0.000216"),
			},
		}

		for _, testCase := range testCases {
			t.Run(fmt.Sprintf("Test: '%s'", testCase.modelType), func(t *testing.T) {
				modelPricingDTO := services.RetrieveProviderModelPricing(
					context.TODO(),
					testCase.modelType,
					models.ModelVendorOPENAI,
				)

				result := utils.CalculateTokenCountsAndCosts(
					promptInputValue,
					promptOutputValue,
					modelPricingDTO,
					testCase.modelType,
				)

				assert.Equal(t, expectedInputTokenCount, result.InputTokenCount)
				assert.Equal(t, expectedOutputTokenCount, result.OutputTokenCount)
				assert.Equal(
					t,
					testCase.expectedInputTokenCost.String(),
					result.InputTokenCost.String(),
				)
				assert.Equal(
					t,
					testCase.expectedOutputTokenCost.String(),
					result.OutputTokenCost.String(),
				)
			})
		}
	})
}

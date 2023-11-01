package tokenutils_test

import (
	"fmt"
	"github.com/basemind-ai/monorepo/shared/go/db/models"
	"testing"

	"github.com/basemind-ai/monorepo/shared/go/tokenutils"
	"github.com/stretchr/testify/assert"
)

func TestTokenUtils(t *testing.T) {
	t.Run("GetPromptTokenCount", func(t *testing.T) {
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
				count := tokenutils.GetPromptTokenCount(testCase.input, models.ModelTypeGpt35Turbo)
				assert.Equal(t, testCase.expected, count)
			})
		}
	})

	t.Run("GetCostByModelType", func(t *testing.T) {
		testCases := []struct {
			modelType  models.ModelType
			totalToken float64
			expected   float64
		}{
			{
				modelType:  models.ModelTypeGpt35Turbo,
				totalToken: 0.000002,
				expected:   0.000004,
			},
			{
				modelType:  models.ModelTypeGpt35Turbo16k,
				totalToken: 0.000004,
				expected:   0.000008,
			},
			{
				modelType:  models.ModelTypeGpt4,
				totalToken: 0.000006,
				expected:   0.000012,
			},
			{
				modelType:  models.ModelTypeGpt432k,
				totalToken: 0.000012,
				expected:   0.000024,
			},
		}

		for _, testCase := range testCases {
			t.Run(fmt.Sprintf("Test: '%s'", testCase.modelType), func(t *testing.T) {
				result := tokenutils.GetCostByModelType(2, testCase.modelType)
				assert.Equal(t, testCase.expected, result)
			})
		}
	})
}

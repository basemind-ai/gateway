package tokenutils_test

import (
	"fmt"
	"testing"

	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/tokenutils"
	"github.com/stretchr/testify/assert"
)

func TestGetPromptTokenCount(t *testing.T) {
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
		t.Run(fmt.Sprintf("Test: %d", testCase.expected), func(t *testing.T) {
			actual, _ := tokenutils.GetPromptTokenCount(testCase.input, db.ModelTypeGpt35Turbo)
			assert.Equal(t, testCase.expected, actual)
		})
	}

	// test for the invalid encodings
	tokenCnt, err := tokenutils.GetPromptTokenCount("Hello world!", db.ModelType("invalid"))
	assert.NotNil(t, err)
	assert.Equal(t, int32(-1), tokenCnt)
}

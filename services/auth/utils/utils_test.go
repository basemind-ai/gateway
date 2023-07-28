package utils_test

import (
	"testing"

	"github.com/basemind-ai/backend-services/services/auth/utils"

	"github.com/stretchr/testify/assert"
)

func TestCreateRandomString(t *testing.T) {
	result := utils.CreateStateString()
	assert.NotEmpty(t, result)
}

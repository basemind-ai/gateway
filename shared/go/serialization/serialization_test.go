package serialization_test

import (
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"io"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestReadResponseBody(t *testing.T) {
	// write a test for ReadResponseBody(response *http.Response) ([]byte, error)
	body := io.NopCloser(strings.NewReader("Hello World"))
	result, err := serialization.ReadBody(body)
	assert.Nil(t, err)
	assert.Equal(t, result, []byte("Hello World"))
}

func TestDeserializeJson(t *testing.T) {
	// write a test for DeserializeJson[T any](response *http.Response, targetType T) error
	body := io.NopCloser(strings.NewReader(`{"message":"Hello World"}`))

	target := struct {
		Message string
	}{}
	err := serialization.DeserializeJson(body, &target)
	assert.Nil(t, err)
	assert.Equal(t, target.Message, "Hello World")
}

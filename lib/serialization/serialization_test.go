package serialization_test

import (
	"io"
	"net/http"
	"strings"
	"testing"

	"github.com/basemind-ai/backend-services/lib/serialization"
	"github.com/stretchr/testify/assert"
)

func TestReadResponseBody(t *testing.T) {
	// write a test for ReadResponseBody(response *http.Response) ([]byte, error)
	body := io.NopCloser(strings.NewReader("Hello World"))
	response := &http.Response{
		Body: body,
	}
	result, err := serialization.ReadResponseBody(response)
	assert.Nil(t, err)
	assert.Equal(t, result, []byte("Hello World"))
}

func TestDeserializeJson(t *testing.T) {
	// write a test for DeserializeJson[T any](response *http.Response, targetType T) error
	body := io.NopCloser(strings.NewReader(`{"message":"Hello World"}`))
	response := &http.Response{
		Body: body,
	}
	target := struct {
		Message string
	}{}
	err := serialization.DeserializeJson(response, &target)
	assert.Nil(t, err)
	assert.Equal(t, target.Message, "Hello World")
}

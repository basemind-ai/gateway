package api_test

import (
	"net/http"
	"strings"
	"testing"

	"github.com/basemind-ai/backend-services/lib/serialization"
	"github.com/basemind-ai/backend-services/lib/server"

	"github.com/basemind-ai/backend-services/services/auth/api"
	"github.com/stretchr/testify/assert"
)

func TestInitOAuth(t *testing.T) {
	testClient := server.CreateTestClient(api.RegisterHandlers)
	url := "/v1" + strings.ReplaceAll(api.InitAuthPath, ":provider", "github")
	res, err := testClient.Get(url)

	assert.Nil(t, err)
	assert.Equal(t, http.StatusOK, res.StatusCode)

	body := api.OAuthInitResponseBody{}
	unmarshalErr := serialization.DeserializeJson(res, &body)

	assert.Nil(t, unmarshalErr)
	assert.NotEmpty(t, body.RedirectUrl)
}

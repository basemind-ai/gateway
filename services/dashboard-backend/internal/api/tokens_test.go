package api_test

import (
	"fmt"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/api"
	"testing"
)

func TestTokensAPI(t *testing.T) {
	t.Run(fmt.Sprintf("GET: %s", api.ApplicationTokensEndpoint), func(t *testing.T) {
		t.Run("returns a list of all application tokens", func(t *testing.T) {})
		t.Run("returns an error if the application id is invalid", func(t *testing.T) {})
	})

	t.Run(fmt.Sprintf("POST: %s", api.ApplicationTokensEndpoint), func(t *testing.T) {
		t.Run("creates a new application token", func(t *testing.T) {})
		t.Run("returns an error if the application id is invalid", func(t *testing.T) {})
	})

	t.Run(fmt.Sprintf("DELETE: %s", api.ApplicationTokensEndpoint), func(t *testing.T) {
		t.Run("deletes an application token", func(t *testing.T) {})
		t.Run("returns an error if the application id is invalid", func(t *testing.T) {})
	})
}

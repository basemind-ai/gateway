package github_test

import (
	"context"
	"testing"

	"github.com/basemind-ai/backend-services/services/auth/providers/github"
	"github.com/stretchr/testify/assert"
)

func TestGetConfig(t *testing.T) {
	t.Setenv("PORT", "3000")
	t.Setenv("ENVIRONMENT", "development")
	t.Setenv("BASE_URL", "http://localhost:3000")
	t.Setenv("GITHUB_CLIENT_ID", "githubClientId")
	t.Setenv("GITHUB_CLIENT_SECRET", "githubClientSecret")

	config, err := github.GetConfig(context.TODO())

	assert.Nil(t, err)
	assert.Equal(t, config.ClientID, "githubClientId")
	assert.Equal(t, config.ClientSecret, "githubClientSecret")
	assert.Equal(t, config.RedirectURL, "http://localhost:3000/oauth/github/callback")
}

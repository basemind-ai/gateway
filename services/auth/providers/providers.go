package providers

import (
	"context"
	"fmt"

	"github.com/basemind-ai/backend-services/services/auth/providers/github"
	"github.com/basemind-ai/backend-services/services/auth/types"
	"golang.org/x/oauth2"
)

func GetProvider(ctx context.Context, providerName string) (*oauth2.Config, error) {
	switch providerName {
	case types.ProviderGithub:
		return github.GetConfig(ctx)
	case types.ProviderGitlab:
	case types.ProviderBitBucket:
	case types.ProviderGoogle:
		return nil, fmt.Errorf(fmt.Sprintf("not implemented for provider %s", providerName))
	}
	return nil, fmt.Errorf(fmt.Sprintf("unsupported provider %s", providerName))
}

func GetUserData(ctx context.Context, token *oauth2.Token, providerName string) (*types.UserData, error) {
	switch providerName {
	case types.ProviderGithub:
		return github.GetUserData(ctx, token)
	case types.ProviderGitlab:
	case types.ProviderBitBucket:
	case types.ProviderGoogle:
		return nil, fmt.Errorf(fmt.Sprintf("not implemented for provider %s", providerName))
	}
	return nil, fmt.Errorf(fmt.Sprintf("unsupported provider %s", providerName))
}

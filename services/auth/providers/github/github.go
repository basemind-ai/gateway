package github

import (
	"context"
	"fmt"
	"sync"

	"github.com/basemind-ai/backend-services/lib/serialization"
	"github.com/basemind-ai/backend-services/services/auth/config"
	"github.com/basemind-ai/backend-services/services/auth/types"
	"github.com/rs/zerolog/log"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/endpoints"
)

var (
	once   sync.Once
	github *oauth2.Config
)

const (
	UserProfileURL = "https://api.github.com/user"
)

type GithubUserData struct {
	ID        int    `json:"id"`
	Email     string `json:"email"`
	Bio       string `json:"bio"`
	Name      string `json:"name"`
	Login     string `json:"login"`
	AvatarUrl string `json:"avatar_url"`
	Location  string `json:"location"`
	Company   string `json:"company"`
}

func GetConfig(ctx context.Context) (*oauth2.Config, error) {
	cfg, err := config.Get(ctx)
	if err != nil {
		return nil, err
	}

	once.Do(func() {
		github = &oauth2.Config{
			ClientID:     cfg.GithubClientId,
			ClientSecret: cfg.GithubClientSecret,
			RedirectURL:  fmt.Sprintf("%s/oauth/github/callback", cfg.BaseUrl),
			Scopes:       []string{"read:user", "user:email"},
			Endpoint: oauth2.Endpoint{
				AuthURL:  endpoints.GitHub.AuthURL,
				TokenURL: endpoints.GitHub.TokenURL,
			},
		}
	})
	return github, nil
}

func GetUserData(ctx context.Context, token *oauth2.Token) (*types.UserData, error) {
	client := github.Client(ctx, token)

	response, requestErr := client.Get(UserProfileURL)
	if requestErr != nil {
		return nil, requestErr
	}

	githubUserData := GithubUserData{}
	deserializationError := serialization.DeserializeJson(response, &githubUserData)
	if deserializationError != nil {
		return nil, deserializationError
	}
	log.Debug().Interface("github user data", githubUserData).Msg("user data received from github")

	return &types.UserData{
		Provider:          types.ProviderGithub,
		ProviderID:        githubUserData.ID,
		Email:             githubUserData.Email,
		Bio:               githubUserData.Bio,
		FullName:          githubUserData.Name,
		Username:          githubUserData.Login,
		ProfilePictureUrl: githubUserData.AvatarUrl,
		Location:          githubUserData.Location,
		Company:           githubUserData.Company,
	}, nil
}

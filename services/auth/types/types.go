package types

type UserData struct {
	Bio               string `json:"bio"`
	Company           string `json:"company"`
	Email             string `json:"email"`
	FullName          string `json:"name"`
	Location          string `json:"location"`
	ProfilePictureUrl string `json:"profilePictureUrl"`
	Provider          string `json:"provider"`
	ProviderID        int    `json:"providerId"`
	Username          string `json:"login"`
}

const (
	ProviderGithub    = "github"
	ProviderGitlab    = "gitlab"
	ProviderBitBucket = "bitbucket"
	ProviderGoogle    = "google"
)

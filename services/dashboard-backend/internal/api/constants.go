package api

const (
	UserAccountEndpoint            = "/user-account"
	ProjectsListEndpoint           = "/projects"
	ProjectDetailEndpoint          = "/projects/{projectId}"
	ProjectUserDetailEndpoint      = "/projects/{projectId}/users/{userId}"
	ApplicationsListEndpoint       = "/projects/{projectId}/applications"
	ApplicationDetailEndpoint      = "/projects/{projectId}/applications/{applicationId}"
	ApplicationTokensListEndpoint  = "/projects/{projectId}/applications/{applicationId}/tokens"           //nolint: gosec
	ApplicationTokenDetailEndpoint = "/projects/{projectId}/applications/{applicationId}/tokens/{tokenId}" //nolint: gosec
	PromptConfigListEndpoint       = "/projects/{projectId}/applications/{applicationId}/prompt-configs"
	PromptConfigDetailEndpoint     = "/projects/{projectId}/applications/{applicationId}/prompt-configs/{promptConfigId}"
	PromptConfigSetDefaultEndpoint = "/projects/{projectId}/applications/{applicationId}/prompt-configs/{promptConfigId}/set-default"
)

const (
	InvalidProjectIdError      = "projectId is not a valid UUID value"
	InvalidApplicationIdError  = "applicationId is not a valid UUID value"
	InvalidPromptConfigIdError = "promptConfigId is not a valid UUID value"
	InvalidRequestBodyError    = "invalid request body"
)

package api

const (
	ProjectsListEndpoint           = "/projects"
	ProjectAnalyticsEndpoint       = "/projects/{projectId}/analytics"
	ProjectDetailEndpoint          = "/projects/{projectId}"
	ProjectUserListEndpoint        = "/projects/{projectId}/users"
	ProjectUserDetailEndpoint      = "/projects/{projectId}/users/{userId}"
	ApplicationsListEndpoint       = "/projects/{projectId}/applications"
	ApplicationAnalyticsEndpoint   = "/projects/{projectId}/applications/{applicationId}/analytics"
	ApplicationDetailEndpoint      = "/projects/{projectId}/applications/{applicationId}"
	ApplicationTokensListEndpoint  = "/projects/{projectId}/applications/{applicationId}/tokens"           //nolint: gosec
	ApplicationTokenDetailEndpoint = "/projects/{projectId}/applications/{applicationId}/tokens/{tokenId}" //nolint: gosec
	PromptConfigAnalyticsEndpoint  = "/projects/{projectId}/applications/{applicationId}/prompt-configs/{promptConfigId}/analytics"
	PromptConfigDetailEndpoint     = "/projects/{projectId}/applications/{applicationId}/prompt-configs/{promptConfigId}"
	PromptConfigListEndpoint       = "/projects/{projectId}/applications/{applicationId}/prompt-configs"
	PromptConfigSetDefaultEndpoint = "/projects/{projectId}/applications/{applicationId}/prompt-configs/{promptConfigId}/set-default"
	PromptConfigTestingEndpoint    = "/projects/{projectId}/applications/{applicationId}/prompt-configs/test"
)

const (
	invalidRequestBodyError = "invalid request body"
)

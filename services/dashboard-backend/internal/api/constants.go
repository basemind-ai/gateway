package api

const (
	ApplicationAPIKeyDetailEndpoint  = "/projects/{projectId}/applications/{applicationId}/apikeys/{apiKeyId}" //nolint: gosec
	ApplicationAPIKeysListEndpoint   = "/projects/{projectId}/applications/{applicationId}/apikeys"            //nolint: gosec
	ApplicationAnalyticsEndpoint     = "/projects/{projectId}/applications/{applicationId}/analytics"
	ApplicationDetailEndpoint        = "/projects/{projectId}/applications/{applicationId}"
	ApplicationsListEndpoint         = "/projects/{projectId}/applications"
	InviteUserWebhookEndpoint        = "/webhooks/invite-user"
	ProjectAnalyticsEndpoint         = "/projects/{projectId}/analytics"
	ProjectDetailEndpoint            = "/projects/{projectId}"
	ProjectOTPEndpoint               = "/projects/{projectId}/otp"
	ProjectProviderKeyDetailEndpoint = "/projects/{projectId}/provider-keys/{providerKeyId}"
	ProjectProviderKeyListEndpoint   = "/projects/{projectId}/provider-keys"
	ProjectUserDetailEndpoint        = "/projects/{projectId}/users/{userId}"
	ProjectUserListEndpoint          = "/projects/{projectId}/users"
	ProjectsListEndpoint             = "/projects"
	PromptConfigAnalyticsEndpoint    = "/projects/{projectId}/applications/{applicationId}/prompt-configs/{promptConfigId}/analytics"
	PromptConfigDetailEndpoint       = "/projects/{projectId}/applications/{applicationId}/prompt-configs/{promptConfigId}"
	PromptConfigListEndpoint         = "/projects/{projectId}/applications/{applicationId}/prompt-configs"
	PromptConfigSetDefaultEndpoint   = "/projects/{projectId}/applications/{applicationId}/prompt-configs/{promptConfigId}/set-default"
	PromptConfigTestingEndpoint      = "/projects/{projectId}/applications/{applicationId}/prompt-configs/test"
	SupportRequestEndpoint           = "/support"
	UserAccountDetailEndpoint        = "/users"
)

const (
	invalidRequestBodyError = "invalid request body"
	invalidIDError          = "invalid id"
)

const (
	UserInvitationEmailTemplateID = "d-a53e6310aa094a7abb18334949bba0f2"
	SupportEmailTemplateID        = "d-67b1f348e3f44518803d5cb03a8c1438"
)

const (
	SupportEmailAddress = "support@basemind.ai"
)

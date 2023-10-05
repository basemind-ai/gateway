package api

const (
	ProjectsListEndpoint       = "/projects"
	ApplicationsListEndpoint   = "/projects/{projectId}/applications"
	ApplicationDetailEndpoint  = "/projects/{projectId}/applications/{applicationId}"
	PromptConfigListEndpoint   = "/projects/{projectId}/applications/{applicationId}/prompt-configs"
	PromptConfigDetailEndpoint = "/projects/{projectId}/applications/{applicationId}/prompt-configs/{promptConfigId}"
)

const (
	InvalidProjectIdError      = "projectId is not a valid UUID value"
	InvalidApplicationIdError  = "applicationId is not a valid UUID value"
	InvalidPromptConfigIdError = "promptConfigId is not a valid UUID value"
	InvalidRequestBodyError    = "invalid request body"
)

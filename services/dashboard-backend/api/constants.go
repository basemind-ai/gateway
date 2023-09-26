package api

const (
	ProjectsListEndpoint      = "/projects"
	ApplicationsListEndpoint  = "/projects/{projectId}/applications"
	ApplicationDetailEndpoint = "/projects/{projectId}/applications/{applicationId}"
)

const (
	InvalidProjectIdError     = "projectId is not a valid UUID value"
	InvalidApplicationIdError = "applicationId is not a valid UUID value"
	InvalidRequestBodyError   = "invalid request body"
)

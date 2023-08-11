package apierror

import (
	"net/http"

	"github.com/basemind-ai/backend-services/lib/serialization"
)

type ApiError struct {
	Message    string `json:"message"`
	StatusText string `json:"status"`
	StatusCode int    `json:"statusCode"`
}

func (e *ApiError) Render(w http.ResponseWriter, r *http.Request) error {
	return serialization.RenderJsonResponse(w, e.StatusCode, e)
}

func NewApiError(message string, statusCode int) *ApiError {
	return &ApiError{StatusCode: statusCode, Message: message, StatusText: http.StatusText(statusCode)}
}

func BadRequest(message string) *ApiError {
	return NewApiError(message, http.StatusBadRequest)
}

func Unauthorized(message string) *ApiError {
	return NewApiError(message, http.StatusUnauthorized)
}

func UnprocessableContent(message string) *ApiError {
	return NewApiError(message, http.StatusUnprocessableEntity)
}

func InternalServerError(message string) *ApiError {
	return NewApiError(message, http.StatusInternalServerError)
}

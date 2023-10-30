package apierror

import (
	"fmt"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"net/http"
	"reflect"
)

// APIError - represents an API error.
// Its a type that can render itself into an HTTP response.
type APIError struct {
	Message    string `json:"message"`
	StatusText string `json:"status"`
	StatusCode int    `json:"statusCode"`
	Extra      any    `json:"extra,omitempty"`
}

// Render - renders the APIError into an HTTP response.
func (e *APIError) Render(w http.ResponseWriter) {
	serialization.RenderJSONResponse(w, e.StatusCode, e)
}

// Error - returns the error message.
// This receiver ensures that APIError fulfills the Error interface.
func (e *APIError) Error() string {
	return fmt.Sprintf("status: %d, message: %s", e.StatusCode, e.Message)
}

// New - creates a new APIError.
func New(statusCode int, args ...any) *APIError {
	var message string
	if l := len(args); l == 1 && reflect.TypeOf(args[0]).Kind() == reflect.String {
		message = args[0].(string)
	} else {
		message = http.StatusText(statusCode)
	}

	return &APIError{
		StatusCode: statusCode,
		Message:    message,
		StatusText: http.StatusText(statusCode),
	}
}

// NotFound - creates a new APIError with status code 404.
func NotFound(message ...any) *APIError {
	return New(http.StatusNotFound, message...)
}

// BadRequest - creates a new APIError with status code 400.
func BadRequest(message ...any) *APIError {
	return New(http.StatusBadRequest, message...)
}

// Unauthorized - creates a new APIError with status code 401.
func Unauthorized(message ...any) *APIError {
	return New(http.StatusUnauthorized, message...)
}

// Forbidden - creates a new APIError with status code 403.
func Forbidden(message ...any) *APIError {
	return New(http.StatusForbidden, message...)
}

// UnprocessableContent - creates a new APIError with status code 422.
func UnprocessableContent(message ...any) *APIError {
	return New(http.StatusUnprocessableEntity, message...)
}

// InternalServerError - creates a new APIError with status code 500.
func InternalServerError(message ...any) *APIError {
	return New(http.StatusInternalServerError, message...)
}

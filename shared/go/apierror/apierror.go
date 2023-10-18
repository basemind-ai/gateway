package apierror

import (
	"fmt"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"net/http"
	"reflect"
)

type APIError struct {
	Message    string `json:"message"`
	StatusText string `json:"status"`
	StatusCode int    `json:"statusCode"`
}

func (e *APIError) Render(w http.ResponseWriter, _ *http.Request) {
	serialization.RenderJSONResponse(w, e.StatusCode, e)
}

func (e *APIError) Error() string {
	return fmt.Sprintf("status: %d, message: %s", e.StatusCode, e.Message)
}

func newAPIError(statusCode int, args ...any) *APIError {
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

func NotFound(message ...any) *APIError {
	return newAPIError(http.StatusNotFound, message...)
}

func BadRequest(message ...any) *APIError {
	return newAPIError(http.StatusBadRequest, message...)
}

func Unauthorized(message ...any) *APIError {
	return newAPIError(http.StatusUnauthorized, message...)
}

func Forbidden(message ...any) *APIError {
	return newAPIError(http.StatusForbidden, message...)
}

func UnprocessableContent(message ...any) *APIError {
	return newAPIError(http.StatusUnprocessableEntity, message...)
}

func InternalServerError(message ...any) *APIError {
	return newAPIError(http.StatusInternalServerError, message...)
}

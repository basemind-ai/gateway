package apierror

import (
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"net/http"
	"reflect"
)

type ApiError struct {
	Message    string `json:"message"`
	StatusText string `json:"status"`
	StatusCode int    `json:"statusCode"`
}

func (e *ApiError) Render(w http.ResponseWriter, _ *http.Request) error {
	return serialization.RenderJsonResponse(w, e.StatusCode, e)
}

func NewApiError(statusCode int, args ...interface{}) *ApiError {
	var message string
	if l := len(args); l == 1 && reflect.TypeOf(args[0]).Kind() == reflect.String {
		message = args[0].(string)
	} else {
		message = http.StatusText(statusCode)
	}

	return &ApiError{StatusCode: statusCode, Message: message, StatusText: http.StatusText(statusCode)}
}

func BadRequest(message ...interface{}) *ApiError {
	return NewApiError(http.StatusBadRequest, message...)
}

func Unauthorized(message ...interface{}) *ApiError {
	return NewApiError(http.StatusUnauthorized, message...)
}

func UnprocessableContent(message ...interface{}) *ApiError {
	return NewApiError(http.StatusUnprocessableEntity, message...)
}

func InternalServerError(message ...interface{}) *ApiError {
	return NewApiError(http.StatusInternalServerError, message...)
}

package apierror

import (
	"net/http"

	"github.com/go-chi/render"
)

type ApiError struct {
	Message    string `json:"message"`
	StatusText string `json:"status"`
	StatusCode int    `json:"statusCode"`
}

func (e *ApiError) Render(w http.ResponseWriter, r *http.Request) error {
	render.Status(r, e.StatusCode)
	render.JSON(w, r, e)
	return nil
}

func NewApiError(message string, statusCode int) render.Renderer {
	return &ApiError{StatusCode: statusCode, Message: message, StatusText: http.StatusText(statusCode)}
}

func BadRequest(message string) render.Renderer {
	return NewApiError(message, http.StatusBadRequest)
}

func Unauthorized(message string) render.Renderer {
	return NewApiError(message, http.StatusUnauthorized)
}

func UnprocessableContent(message string) render.Renderer {
	return NewApiError(message, http.StatusUnprocessableEntity)
}

func InternalServerError(message string) render.Renderer {
	return NewApiError(message, http.StatusInternalServerError)
}

package serialization

import (
	"encoding/json"
	"github.com/rs/zerolog/log"
	"io"
	"net/http"
)

func ReadBody(body io.ReadCloser) ([]byte, error) {
	defer func() {
		_ = body.Close()
	}()

	data, readErr := io.ReadAll(body)
	if readErr != nil {
		return nil, readErr
	}

	return data, nil
}

func DeserializeJson[T any](body io.ReadCloser, targetType T) error {
	data, err := ReadBody(body)
	if err != nil {
		return err
	}
	return json.Unmarshal(data, targetType)
}

func RenderJsonResponse(w http.ResponseWriter, statusCode int, body any) {
	w.WriteHeader(statusCode)
	w.Header().Set("Content-Type", "application/json")
	if renderErr := json.NewEncoder(w).Encode(body); renderErr != nil {
		log.Error().Err(renderErr).Msg("failed to render json response")
		http.Error(
			w,
			http.StatusText(http.StatusInternalServerError),
			http.StatusInternalServerError,
		)
	}
}

package serialization

import (
	"encoding/json"
	"github.com/basemind-ai/monorepo/shared/go/exc"
	"github.com/rs/zerolog/log"
	"io"
	"net/http"
)

func ReadBody(body io.ReadCloser) ([]byte, error) {
	defer func() {
		exc.LogIfErr(body.Close(), "error closing body")
	}()

	data, readErr := io.ReadAll(body)
	if readErr != nil {
		return nil, readErr
	}

	return data, nil
}

func DeserializeJSON[T any](body io.ReadCloser, targetType T) error {
	data, err := ReadBody(body)
	if err != nil {
		return err
	}
	return json.Unmarshal(data, targetType)
}

func RenderJSONResponse(w http.ResponseWriter, statusCode int, body any) {
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

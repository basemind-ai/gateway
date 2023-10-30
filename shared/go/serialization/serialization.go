package serialization

import (
	"encoding/json"
	"fmt"
	"github.com/basemind-ai/monorepo/shared/go/exc"
	"github.com/rs/zerolog/log"
	"io"
	"net/http"
)

// ReadBody - reads the body and returns the data.
func ReadBody(body io.ReadCloser) ([]byte, error) {
	defer func() {
		exc.LogIfErr(body.Close(), "error closing body")
	}()

	data, readErr := io.ReadAll(body)
	if readErr != nil {
		return nil, fmt.Errorf("failed to read body: %w", readErr)
	}

	return data, nil
}

// DeserializeJSON - deserializes the body to the target.
func DeserializeJSON[T any](body io.ReadCloser, targetType T) error {
	data, err := ReadBody(body)
	if err != nil {
		return err
	}
	return json.Unmarshal(data, targetType)
}

// SerializeJSON - serializes the target to json.
// Panics if the target cannot be serialized.
func SerializeJSON[T any](target T) []byte {
	result, err := json.Marshal(target)
	return exc.MustResult(result, err, "failed to serialize json")
}

// RenderJSONResponse - renders the target as a JSON type response.
func RenderJSONResponse(w http.ResponseWriter, statusCode int, body any) {
	if renderErr := json.NewEncoder(w).Encode(body); renderErr != nil {
		log.Error().Err(renderErr).Msg("failed to render json response")
		http.Error(
			w,
			http.StatusText(http.StatusInternalServerError),
			http.StatusInternalServerError,
		)
		return
	}

	w.WriteHeader(statusCode)
	w.Header().Set("Content-Type", "application/json")
}

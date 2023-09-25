package serialization

import (
	"encoding/json"
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

func RenderJsonResponse(w http.ResponseWriter, statusCode int, body any) error {
	w.WriteHeader(statusCode)
	w.Header().Set("Content-Type", "application/json")
	return json.NewEncoder(w).Encode(body)
}

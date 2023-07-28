package serialization

import (
	"encoding/json"
	"io"
	"net/http"
)

func ReadResponseBody(response *http.Response) ([]byte, error) {
	defer func() {
		_ = response.Body.Close()
	}()

	data, readErr := io.ReadAll(response.Body)
	if readErr != nil {
		return nil, readErr
	}

	return data, nil
}

func DeserializeJson[T any](response *http.Response, targetType T) error {
	data, err := ReadResponseBody(response)
	if err != nil {
		return err
	}
	return json.Unmarshal(data, targetType)
}

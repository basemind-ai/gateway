package httpclient

import (
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

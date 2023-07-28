package httpclient

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func CreateTestClient(t *testing.T, handler http.Handler) Client {
	server := httptest.NewServer(handler)

	t.Cleanup(func() {
		server.Close()
	})

	return New(server.URL, server.Client())
}

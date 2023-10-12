package testutils

import (
	"github.com/basemind-ai/monorepo/shared/go/httpclient"
	"net/http"
	"net/http/httptest"
	"testing"
)

func CreateTestHTTPClient(t *testing.T, handler http.Handler) httpclient.Client {
	t.Helper()
	server := httptest.NewServer(handler)

	t.Cleanup(func() {
		server.Close()
	})

	return httpclient.New(server.URL, server.Client())
}

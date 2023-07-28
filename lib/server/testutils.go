package server

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"

	"github.com/gofiber/fiber/v2"
)

type TestClient struct {
	app *fiber.App
}

func CreateTestClient(registerHandlers func(apiGroup *fiber.App)) *TestClient {
	srv := CreateServer(Options{
		Environment:      "test",
		RegisterHandlers: registerHandlers,
	})
	return &TestClient{app: srv}
}

func (client *TestClient) Request(method, target string, body any) *http.Request {
	var requestBody io.Reader
	if body != nil {
		data, _ := json.Marshal(body)
		requestBody = bytes.NewBuffer(data)
	}

	return httptest.NewRequest(method, target, requestBody)
}

func (client *TestClient) Get(path string) (*http.Response, error) {
	request := client.Request(http.MethodGet, path, nil)
	return client.app.Test(request)
}

func (client *TestClient) Delete(path string) (*http.Response, error) {
	request := client.Request(http.MethodDelete, path, nil)
	return client.app.Test(request)
}

func (client *TestClient) Post(path string, body any) (*http.Response, error) {
	request := client.Request(http.MethodPost, path, body)
	return client.app.Test(request)
}

func (client *TestClient) Patch(path string, body any) (*http.Response, error) {
	request := client.Request(http.MethodPatch, path, body)
	return client.app.Test(request)
}

func (client *TestClient) Put(path string, body any) (*http.Response, error) {
	request := client.Request(http.MethodPut, path, body)
	return client.app.Test(request)
}

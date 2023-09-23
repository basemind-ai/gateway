package httpclient

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"io"
	"net/http"
	"time"
)

type Client struct {
	BaseUrl    string
	HttpClient *http.Client
}

type HTTPHeader struct {
	Key   string
	Value string
}

type HTTPResponse struct {
	Body       []byte
	StatusCode int
	Status     string
}

func New(baseUrl string,
	httpClient *http.Client) Client {
	if httpClient != nil {
		return Client{BaseUrl: baseUrl, HttpClient: httpClient}
	}
	return Client{BaseUrl: baseUrl, HttpClient: &http.Client{Timeout: time.Duration(1) * time.Second}}
}

func (client *Client) Request(ctx context.Context, method string, path string, body any, headers ...HTTPHeader) (*HTTPResponse, error) {
	var requestBody io.Reader
	if body != nil {
		data, _ := json.Marshal(body)
		requestBody = bytes.NewBuffer(data)
	}

	url := fmt.Sprintf("%s%s", client.BaseUrl, path)

	request, requestErr := http.NewRequestWithContext(ctx, method, url, requestBody)
	if requestErr != nil {
		return nil, requestErr
	}

	request.Header.Add("Accept", `application/json`)

	for _, header := range headers {
		request.Header.Add(header.Key, header.Value)
	}

	response, responseErr := client.HttpClient.Do(request)
	if responseErr != nil {
		return nil, responseErr
	}

	data, readResponseErr := serialization.ReadResponseBody(response)
	if readResponseErr != nil {
		return nil, readResponseErr
	}

	return &HTTPResponse{Body: data, StatusCode: response.StatusCode, Status: response.Status}, nil
}

func (client *Client) Get(ctx context.Context, path string, headers ...HTTPHeader) (*HTTPResponse, error) {
	return client.Request(ctx, http.MethodGet, path, nil, headers...)
}

func (client *Client) Delete(ctx context.Context, path string, headers ...HTTPHeader) (*HTTPResponse, error) {
	return client.Request(ctx, http.MethodDelete, path, nil, headers...)
}

func (client *Client) Post(ctx context.Context, path string, body any, headers ...HTTPHeader) (*HTTPResponse, error) {
	return client.Request(ctx, http.MethodPost, path, body, headers...)
}

func (client *Client) Put(ctx context.Context, path string, body any, headers ...HTTPHeader) (*HTTPResponse, error) {
	return client.Request(ctx, http.MethodPut, path, body, headers...)
}

func (client *Client) Patch(ctx context.Context, path string, body any, headers ...HTTPHeader) (*HTTPResponse, error) {
	return client.Request(ctx, http.MethodPatch, path, body, headers...)
}

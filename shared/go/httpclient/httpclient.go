package httpclient

import (
	"bytes"
	"context"
	"fmt"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"io"
	"net/http"
	"time"
)

type Client struct {
	BaseURL    string
	HTTPClient *http.Client
}

type HTTPHeader struct {
	Key   string
	Value string
}

func New(baseURL string,
	httpClient *http.Client) Client {
	if httpClient != nil {
		return Client{BaseURL: baseURL, HTTPClient: httpClient}
	}
	return Client{
		BaseURL:    baseURL,
		HTTPClient: &http.Client{Timeout: time.Duration(1) * time.Second},
	}
}

func (client *Client) request(
	ctx context.Context,
	method string,
	path string,
	body any,
	headers ...HTTPHeader,
) (*http.Response, error) {
	var requestBody io.Reader
	if body != nil {
		data := serialization.SerializeJSON(body)
		requestBody = bytes.NewBuffer(data)
	}

	url := fmt.Sprintf("%s%s", client.BaseURL, path)

	request, requestErr := http.NewRequestWithContext(ctx, method, url, requestBody)
	if requestErr != nil {
		return nil, requestErr
	}

	request.Header.Add("Accept", `application/json`)

	for _, header := range headers {
		request.Header.Add(header.Key, header.Value)
	}

	response, responseErr := client.HTTPClient.Do(request)
	if responseErr != nil {
		return nil, responseErr
	}
	return response, nil
}

func (client *Client) Get(
	ctx context.Context,
	path string,
	headers ...HTTPHeader,
) (*http.Response, error) {
	return client.request(ctx, http.MethodGet, path, nil, headers...)
}

func (client *Client) Delete(
	ctx context.Context,
	path string,
	headers ...HTTPHeader,
) (*http.Response, error) {
	return client.request(ctx, http.MethodDelete, path, nil, headers...)
}

func (client *Client) Post(
	ctx context.Context,
	path string,
	body any,
	headers ...HTTPHeader,
) (*http.Response, error) {
	return client.request(ctx, http.MethodPost, path, body, headers...)
}

func (client *Client) Put(
	ctx context.Context,
	path string,
	body any,
	headers ...HTTPHeader,
) (*http.Response, error) {
	return client.request(ctx, http.MethodPut, path, body, headers...)
}

func (client *Client) Patch(
	ctx context.Context,
	path string,
	body any,
	headers ...HTTPHeader,
) (*http.Response, error) {
	return client.request(ctx, http.MethodPatch, path, body, headers...)
}

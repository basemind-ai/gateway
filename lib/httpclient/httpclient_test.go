package httpclient_test

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"testing"

	"github.com/basemind-ai/backend-services/lib/httpclient"

	"github.com/stretchr/testify/assert"
)

type Body struct {
	Message string
}

func TestClient(t *testing.T) {
	for _, testCase := range []struct {
		Method string
		Body   *Body
	}{
		{
			Method: "GET",
			Body:   nil,
		},
		{
			Method: "DELETE",
			Body:   nil,
		},
		{
			Method: "POST",
			Body:   &Body{Message: "ABC"},
		},
		{
			Method: "PUT",
			Body:   &Body{Message: "ABC"},
		},
		{
			Method: "PATCH",
			Body:   &Body{Message: "ABC"},
		},
	} {
		client := httpclient.CreateTestClient(t, http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
			assert.Equal(t, request.Method, testCase.Method)

			defer func() {
				_ =
					request.Body.Close()
			}()

			if testCase.Body != nil {
				data, _ := io.ReadAll(request.Body)
				body := Body{}
				_ = json.Unmarshal(data, &body)
				assert.Equal(t, body.Message, testCase.Body.Message)
			}
			writer.WriteHeader(http.StatusOK)
		}))
		var (
			res *httpclient.HTTPResponse
			err error
		)
		switch testCase.Method {
		case http.MethodGet:
			res, err = client.Get(context.TODO(), "/")
		case http.MethodDelete:
			res, err = client.Delete(context.TODO(), "/")
		case http.MethodPost:
			res, err = client.Post(context.TODO(), "/", testCase.Body)
		case http.MethodPut:
			res, err = client.Put(context.TODO(), "/", testCase.Body)
		case http.MethodPatch:
			res, err = client.Patch(context.TODO(), "/", testCase.Body)
		}
		assert.Nil(t, err)
		assert.Equal(t, res.StatusCode, http.StatusOK)
	}
}

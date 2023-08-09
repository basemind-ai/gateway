package apierror_test

import (
	"context"
	"net/http"
	"testing"

	"github.com/basemind-ai/backend-services/testingutils"

	"github.com/basemind-ai/backend-services/lib/apierror"
	"github.com/go-chi/render"
	"github.com/stretchr/testify/assert"
)

func TestApiError(t *testing.T) {
	for _, testCase := range []struct {
		ApiErrType     render.Renderer
		ExpectedStatus int
	}{
		{
			ApiErrType:     apierror.BadRequest("err"),
			ExpectedStatus: http.StatusBadRequest,
		},
		{
			ApiErrType:     apierror.Unauthorized("err"),
			ExpectedStatus: http.StatusUnauthorized,
		},
		{
			ApiErrType:     apierror.UnprocessableContent("err"),
			ExpectedStatus: http.StatusUnprocessableEntity,
		},
		{
			ApiErrType:     apierror.InternalServerError("err"),
			ExpectedStatus: http.StatusInternalServerError,
		},
	} {
		client := testingutils.CreateTestClient(t, http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
			_ = render.Render(writer, request, testCase.ApiErrType)
		}))
		res, err := client.Get(context.TODO(), "/")
		assert.Nil(t, err)
		assert.Equal(t, res.StatusCode, testCase.ExpectedStatus)
	}
}

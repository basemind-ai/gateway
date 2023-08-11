package apierror_test

import (
	"context"
	"net/http"
	"testing"

	"github.com/basemind-ai/backend-services/lib/httpclient/testutils"

	"github.com/basemind-ai/backend-services/lib/apierror"
	"github.com/stretchr/testify/assert"
)

func TestApiError(t *testing.T) {
	for _, testCase := range []struct {
		ApiErrType     *apierror.ApiError
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
		client := testutils.CreateTestClient(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			_ = testCase.ApiErrType.Render(w, r)
		}))
		res, err := client.Get(context.TODO(), "/")
		assert.Nil(t, err)
		assert.Equal(t, res.StatusCode, testCase.ExpectedStatus)
	}
}

package apierror_test

import (
	"context"
	"github.com/basemind-ai/monorepo/shared/go/apierror"
	"github.com/basemind-ai/monorepo/shared/go/httpclient/testutils"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestApiError(t *testing.T) {
	t.Parallel()

	for _, testCase := range []struct {
		ApiErrType      *apierror.ApiError
		ExpectedStatus  int
		ExpectedMessage string
	}{
		{
			ApiErrType:      apierror.BadRequest("err"),
			ExpectedStatus:  http.StatusBadRequest,
			ExpectedMessage: "err",
		},
		{
			ApiErrType:      apierror.BadRequest(),
			ExpectedStatus:  http.StatusBadRequest,
			ExpectedMessage: http.StatusText(http.StatusBadRequest),
		},
		{
			ApiErrType:      apierror.Unauthorized("err"),
			ExpectedStatus:  http.StatusUnauthorized,
			ExpectedMessage: "err",
		},
		{
			ApiErrType:      apierror.Unauthorized(),
			ExpectedStatus:  http.StatusUnauthorized,
			ExpectedMessage: http.StatusText(http.StatusUnauthorized),
		},
		{
			ApiErrType:      apierror.UnprocessableContent("err"),
			ExpectedStatus:  http.StatusUnprocessableEntity,
			ExpectedMessage: "err",
		},
		{
			ApiErrType:      apierror.UnprocessableContent(),
			ExpectedStatus:  http.StatusUnprocessableEntity,
			ExpectedMessage: http.StatusText(http.StatusUnprocessableEntity),
		},
		{
			ApiErrType:      apierror.InternalServerError("err"),
			ExpectedStatus:  http.StatusInternalServerError,
			ExpectedMessage: "err",
		},
		{
			ApiErrType:      apierror.InternalServerError(),
			ExpectedStatus:  http.StatusInternalServerError,
			ExpectedMessage: http.StatusText(http.StatusInternalServerError),
		},
	} {
		client := testutils.CreateTestClient(
			t,
			http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				testCase.ApiErrType.Render(w, r)
			}),
		)
		res, err := client.Get(context.TODO(), "/")
		assert.Nil(t, err)
		assert.Equal(t, testCase.ExpectedStatus, res.StatusCode)

		var body apierror.ApiError
		_ = serialization.DeserializeJson(res.Body, &body)
		assert.Equal(t, testCase.ExpectedMessage, body.Message)
	}
}

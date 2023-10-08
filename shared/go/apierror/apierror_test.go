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

func TestAPIError(t *testing.T) {
	t.Parallel()

	for _, testCase := range []struct {
		APIErrType      *apierror.APIError
		ExpectedStatus  int
		ExpectedMessage string
	}{
		{
			APIErrType:      apierror.NotFound("err"),
			ExpectedStatus:  http.StatusNotFound,
			ExpectedMessage: "err",
		},
		{
			APIErrType:      apierror.BadRequest("err"),
			ExpectedStatus:  http.StatusBadRequest,
			ExpectedMessage: "err",
		},
		{
			APIErrType:      apierror.BadRequest(),
			ExpectedStatus:  http.StatusBadRequest,
			ExpectedMessage: http.StatusText(http.StatusBadRequest),
		},
		{
			APIErrType:      apierror.Unauthorized("err"),
			ExpectedStatus:  http.StatusUnauthorized,
			ExpectedMessage: "err",
		},
		{
			APIErrType:      apierror.Forbidden("err"),
			ExpectedStatus:  http.StatusForbidden,
			ExpectedMessage: "err",
		},
		{
			APIErrType:      apierror.Unauthorized(),
			ExpectedStatus:  http.StatusUnauthorized,
			ExpectedMessage: http.StatusText(http.StatusUnauthorized),
		},
		{
			APIErrType:      apierror.UnprocessableContent("err"),
			ExpectedStatus:  http.StatusUnprocessableEntity,
			ExpectedMessage: "err",
		},
		{
			APIErrType:      apierror.UnprocessableContent(),
			ExpectedStatus:  http.StatusUnprocessableEntity,
			ExpectedMessage: http.StatusText(http.StatusUnprocessableEntity),
		},
		{
			APIErrType:      apierror.InternalServerError("err"),
			ExpectedStatus:  http.StatusInternalServerError,
			ExpectedMessage: "err",
		},
		{
			APIErrType:      apierror.InternalServerError(),
			ExpectedStatus:  http.StatusInternalServerError,
			ExpectedMessage: http.StatusText(http.StatusInternalServerError),
		},
	} {
		client := testutils.CreateTestClient(
			t,
			http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				testCase.APIErrType.Render(w, r)
			}),
		)
		res, err := client.Get(context.TODO(), "/")
		assert.Nil(t, err)
		assert.Equal(t, testCase.ExpectedStatus, res.StatusCode)

		var body apierror.APIError
		_ = serialization.DeserializeJSON(res.Body, &body)
		assert.Equal(t, testCase.ExpectedMessage, body.Message)
	}
}

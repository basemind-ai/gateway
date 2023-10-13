package middleware_test

import (
	"context"
	dbTestUtils "github.com/basemind-ai/monorepo/shared/go/testutils"
	"github.com/go-chi/chi/v5"
	"github.com/stretchr/testify/mock"
	"net/http"
	"testing"
)

func TestMain(m *testing.M) {
	cleanup := dbTestUtils.CreateNamespaceTestDBModule("middleware-test")
	defer cleanup()
	m.Run()
}

type nextMock struct {
	mock.Mock
}

func (m *nextMock) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	m.Called(w, r)
}

func createChiRouteContext(
	ctx context.Context,
	keys []string,
	values []string,
) context.Context {
	urlParams := chi.RouteParams{
		Keys:   keys,
		Values: values,
	}

	chiContext := chi.Context{
		URLParams: urlParams,
	}

	return context.WithValue(ctx, chi.RouteCtxKey, &chiContext)
}

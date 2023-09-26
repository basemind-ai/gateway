package api_test

import (
	"context"
	"fmt"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/middleware"
	"github.com/basemind-ai/monorepo/shared/go/db"
	dbTestUtils "github.com/basemind-ai/monorepo/shared/go/db/testutils"
	httpTestUtils "github.com/basemind-ai/monorepo/shared/go/httpclient/testutils"
	"github.com/basemind-ai/monorepo/shared/go/router"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"net/http"
	"testing"

	"github.com/basemind-ai/monorepo/services/dashboard-backend/api"

	"github.com/stretchr/testify/assert"
)

func createMockFirebaseAuthMiddleware(userId string) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := context.WithValue(r.Context(), middleware.FireBaseIdContextKey, userId)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func TestAPI(t *testing.T) {
	dbTestUtils.CreateTestDB(t)

	t.Run("HandleDashboardUserPostLogin", func(t *testing.T) {
		t.Run("creates a new user and returns its default project", func(t *testing.T) {
			userId := "123abc"
			r := router.New(router.Options{
				Environment:      "test",
				ServiceName:      "test",
				RegisterHandlers: api.RegisterHandlers,
				Middlewares: []func(next http.Handler) http.Handler{
					createMockFirebaseAuthMiddleware(userId),
				},
			})

			testClient := httpTestUtils.CreateTestClient(t, r)

			response, requestErr := testClient.Get(context.TODO(), fmt.Sprintf("/v1%s", api.ProjectsListEndpoint))
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusOK, response.StatusCode)

			projects := make([]db.FindProjectsByUserIdRow, 0)
			deserializationErr := serialization.DeserializeJson(response.Body, &projects)
			assert.NoError(t, deserializationErr)
			assert.Len(t, projects, 1)
			assert.Equal(t, "Default Project", projects[0].Name)
			assert.Equal(t, "Default Project", projects[0].Description)
		})

		t.Run("retrieves projects for existing user", func(t *testing.T) {
			userId := "xxx123"

			_, userCreateErr := api.GetOrCreateUser(context.Background(), db.GetQueries(), userId)
			assert.NoError(t, userCreateErr)

			r := router.New(router.Options{
				Environment:      "test",
				ServiceName:      "test",
				RegisterHandlers: api.RegisterHandlers,
				Middlewares: []func(next http.Handler) http.Handler{
					createMockFirebaseAuthMiddleware(userId),
				},
			})

			testClient := httpTestUtils.CreateTestClient(t, r)

			response, requestErr := testClient.Get(context.TODO(), fmt.Sprintf("/v1%s", api.ProjectsListEndpoint))
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusOK, response.StatusCode)

			projects := make([]db.FindProjectsByUserIdRow, 0)
			deserializationErr := serialization.DeserializeJson(response.Body, &projects)
			assert.NoError(t, deserializationErr)
			assert.Len(t, projects, 1)
			assert.Equal(t, "Default Project", projects[0].Name)
			assert.Equal(t, "Default Project", projects[0].Description)
		})

		t.Run("returns error when a user exists without projects", func(t *testing.T) {
			userId := "zzz123"

			_, userCreateErr := db.GetQueries().CreateUser(context.TODO(), userId)
			assert.NoError(t, userCreateErr)

			r := router.New(router.Options{
				Environment:      "test",
				ServiceName:      "test",
				RegisterHandlers: api.RegisterHandlers,
				Middlewares: []func(next http.Handler) http.Handler{
					createMockFirebaseAuthMiddleware(userId),
				},
			})

			testClient := httpTestUtils.CreateTestClient(t, r)

			response, requestErr := testClient.Get(context.TODO(), fmt.Sprintf("/v1%s", api.ProjectsListEndpoint))
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusInternalServerError, response.StatusCode)
		})
	})
}

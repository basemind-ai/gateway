package middleware_test

import (
	"context"
	"fmt"
	"github.com/basemind-ai/monorepo/e2e/factories"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/middleware"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestAuthorizationMiddleware(t *testing.T) {
	project, _ := factories.CreateProject(context.TODO())
	t.Run("allows all requests if method permissions map is not set", func(t *testing.T) {
		mockNext := &nextMock{}
		mockNext.On("ServeHTTP", mock.Anything, mock.Anything).Return()

		request := httptest.NewRequest(http.MethodGet, "/", nil).WithContext(
			context.WithValue(context.TODO(), middleware.ProjectIDContextKey, project.ID),
		)

		testRecorder := httptest.NewRecorder()
		authorizationMiddleware := middleware.AuthorizationMiddleware(
			middleware.MethodPermissionMap{},
		)
		authorizationMiddleware(mockNext).ServeHTTP(testRecorder, request)

		assert.Equal(t, http.StatusOK, testRecorder.Code)
	})

	for _, permission := range []db.AccessPermissionType{
		db.AccessPermissionTypeMEMBER, db.AccessPermissionTypeADMIN,
	} {
		t.Run(
			fmt.Sprintf(
				"allows the request if the user has the required %s permission",
				permission,
			),
			func(t *testing.T) {
				userAccount, _ := factories.CreateUserAccount(context.TODO())
				_, _ = db.GetQueries().CreateUserProject(context.TODO(), db.CreateUserProjectParams{
					UserID:     userAccount.ID,
					ProjectID:  project.ID,
					Permission: permission,
				})

				mockNext := &nextMock{}
				mockNext.On("ServeHTTP", mock.Anything, mock.Anything).Return()

				request := httptest.NewRequest(http.MethodGet, "/", nil).WithContext(
					context.WithValue(
						context.WithValue(
							context.TODO(),
							middleware.ProjectIDContextKey,
							project.ID,
						),
						middleware.UserAccountContextKey,
						userAccount,
					),
				)

				testRecorder := httptest.NewRecorder()
				authorizationMiddleware := middleware.AuthorizationMiddleware(
					middleware.MethodPermissionMap{},
				)
				authorizationMiddleware(mockNext).ServeHTTP(testRecorder, request)

				assert.Equal(t, http.StatusOK, testRecorder.Code)
			},
		)
	}
	t.Run(
		"responds with status 403 FORBIDDEN if the user does not have project access",
		func(t *testing.T) {
			userAccount, _ := factories.CreateUserAccount(context.TODO())

			mockNext := &nextMock{}
			mockNext.On("ServeHTTP", mock.Anything, mock.Anything).Return()

			request := httptest.NewRequest(http.MethodGet, "/", nil).WithContext(
				context.WithValue(
					context.WithValue(
						context.TODO(),
						middleware.ProjectIDContextKey,
						project.ID,
					),
					middleware.UserAccountContextKey,
					userAccount,
				),
			)

			testRecorder := httptest.NewRecorder()
			authorizationMiddleware := middleware.AuthorizationMiddleware(
				middleware.MethodPermissionMap{
					http.MethodGet: {db.AccessPermissionTypeADMIN, db.AccessPermissionTypeMEMBER},
				},
			)
			authorizationMiddleware(mockNext).ServeHTTP(testRecorder, request)

			assert.Equal(t, http.StatusForbidden, testRecorder.Code)
		},
	)
	t.Run(
		"responds with status 401 UNAUTHORIZED if the user does not have the required permission",
		func(t *testing.T) {
			userAccount, _ := factories.CreateUserAccount(context.TODO())
			_, _ = db.GetQueries().CreateUserProject(context.TODO(), db.CreateUserProjectParams{
				UserID:     userAccount.ID,
				ProjectID:  project.ID,
				Permission: db.AccessPermissionTypeMEMBER,
			})

			mockNext := &nextMock{}
			mockNext.On("ServeHTTP", mock.Anything, mock.Anything).Return()

			request := httptest.NewRequest(http.MethodGet, "/", nil).WithContext(
				context.WithValue(
					context.WithValue(
						context.TODO(),
						middleware.ProjectIDContextKey,
						project.ID,
					),
					middleware.UserAccountContextKey,
					userAccount,
				),
			)

			testRecorder := httptest.NewRecorder()
			authorizationMiddleware := middleware.AuthorizationMiddleware(
				middleware.MethodPermissionMap{
					http.MethodGet: {db.AccessPermissionTypeADMIN},
				},
			)
			authorizationMiddleware(mockNext).ServeHTTP(testRecorder, request)

			assert.Equal(t, http.StatusUnauthorized, testRecorder.Code)
		},
	)
}

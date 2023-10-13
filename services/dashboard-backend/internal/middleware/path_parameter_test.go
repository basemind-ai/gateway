package middleware_test

import (
	"context"
	"fmt"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/middleware"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestPathParameterMiddleware(t *testing.T) {
	t.Run("should return a middleware function", func(t *testing.T) {
		value := middleware.PathParameterMiddleware("projectId")
		assert.NotNil(t, value)
	})

	t.Run("should parse a valid value and set it context", func(t *testing.T) {
		testCases := []struct {
			Key        string
			ContextKey middleware.PathURLContextKeyType
		}{
			{
				Key:        "projectId",
				ContextKey: middleware.ProjectIDContextKey,
			},
			{
				Key:        "applicationId",
				ContextKey: middleware.ApplicationIDContextKey,
			},
			{
				Key:        "userId",
				ContextKey: middleware.UserIDContextKey,
			},
			{
				Key:        "tokenId",
				ContextKey: middleware.TokenIDContextKey,
			},
			{
				Key:        "promptConfigId",
				ContextKey: middleware.PromptConfigIDContextKey,
			},
		}

		for _, testCase := range testCases {
			t.Run(fmt.Sprintf("sets %s in context", testCase.Key), func(t *testing.T) {
				mockNext := &nextMock{}
				mockNext.On("ServeHTTP", mock.Anything, mock.Anything).Return()

				uuidString := "3a8c3c0a-6512-49e5-9b99-98a7d3336659"

				pathParameterMiddleware := middleware.PathParameterMiddleware(
					testCase.Key,
				)(
					mockNext,
				)
				request := httptest.NewRequest(http.MethodGet, "/", nil).WithContext(
					createChiRouteContext(
						context.TODO(),
						[]string{testCase.Key},
						[]string{uuidString},
					),
				)
				testRecorder := httptest.NewRecorder()

				pathParameterMiddleware.ServeHTTP(testRecorder, request)

				newRequest := mockNext.Calls[0].Arguments.Get(1).(*http.Request)
				ctxValue := newRequest.Context().Value(testCase.ContextKey)

				uuidValue, ok := ctxValue.(pgtype.UUID)
				assert.True(t, ok)

				stringValue := db.UUIDToString(&uuidValue)

				assert.Equal(t, uuidString, stringValue)
			})
		}
	})
	t.Run("should handle multiple parameters", func(t *testing.T) {
		mockNext := &nextMock{}
		mockNext.On("ServeHTTP", mock.Anything, mock.Anything).Return()

		projectID := "3a8c3c0a-6512-49e5-9b99-98a7d3336659"
		applicationID := "b5cbc13e-9c5b-42e5-9c25-79e4a4be872a"

		pathParameterMiddleware := middleware.PathParameterMiddleware(
			"projectId",
			"applicationId",
		)(
			mockNext,
		)
		request := httptest.NewRequest(http.MethodGet, "/", nil).WithContext(
			createChiRouteContext(
				context.TODO(),
				[]string{"projectId", "applicationId"},
				[]string{projectID, applicationID},
			),
		)
		testRecorder := httptest.NewRecorder()
		pathParameterMiddleware.ServeHTTP(testRecorder, request)
		newRequest := mockNext.Calls[0].Arguments.Get(1).(*http.Request)

		ctxValue := newRequest.Context().Value(middleware.ProjectIDContextKey)
		uuidValue, ok := ctxValue.(pgtype.UUID)
		assert.True(t, ok)

		stringValue := db.UUIDToString(&uuidValue)
		assert.Equal(t, projectID, stringValue)

		ctxValue = newRequest.Context().Value(middleware.ApplicationIDContextKey)
		uuidValue, ok = ctxValue.(pgtype.UUID)
		assert.True(t, ok)

		stringValue = db.UUIDToString(&uuidValue)
		assert.Equal(t, applicationID, stringValue)
	})
	t.Run("should panic for unknown parameter name", func(t *testing.T) {
		mockNext := &nextMock{}
		mockNext.On("ServeHTTP", mock.Anything, mock.Anything).Return()

		pathParameterMiddleware := middleware.PathParameterMiddleware("invalidId")(mockNext)
		request := httptest.NewRequest(http.MethodGet, "/", nil)
		testRecorder := httptest.NewRecorder()

		assert.Panics(t, func() {
			pathParameterMiddleware.ServeHTTP(testRecorder, request)
		})
	})
	t.Run(
		"should return a BAD REQUEST response for an empty expected parameter",
		func(t *testing.T) {
			mockNext := &nextMock{}
			mockNext.On("ServeHTTP", mock.Anything, mock.Anything).Return()

			pathParameterMiddleware := middleware.PathParameterMiddleware("projectId")(mockNext)
			request := httptest.NewRequest(http.MethodGet, "/", nil).WithContext(
				createChiRouteContext(context.TODO(), []string{"projectId"}, []string{""}),
			)
			testRecorder := httptest.NewRecorder()

			pathParameterMiddleware.ServeHTTP(testRecorder, request)

			assert.Equal(t, http.StatusBadRequest, testRecorder.Code)
		},
	)
	t.Run(
		"should return a BAD REQUEST response for an invalid expected parameter",
		func(t *testing.T) {
			mockNext := &nextMock{}
			mockNext.On("ServeHTTP", mock.Anything, mock.Anything).Return()

			pathParameterMiddleware := middleware.PathParameterMiddleware("projectId")(mockNext)
			request := httptest.NewRequest(http.MethodGet, "/", nil).WithContext(
				createChiRouteContext(context.TODO(), []string{"projectId"}, []string{"invalid"}),
			)
			testRecorder := httptest.NewRecorder()

			pathParameterMiddleware.ServeHTTP(testRecorder, request)

			assert.Equal(t, http.StatusBadRequest, testRecorder.Code)
		},
	)
}

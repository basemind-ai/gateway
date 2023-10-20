package middleware_test

import (
	"context"
	"firebase.google.com/go/v4/auth"
	"fmt"
	"github.com/basemind-ai/monorepo/e2e/factories"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/api"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/dto"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/middleware"
	"github.com/basemind-ai/monorepo/shared/go/config"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/jwtutils"
	"github.com/basemind-ai/monorepo/shared/go/router"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"github.com/basemind-ai/monorepo/shared/go/testutils"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestAuthenticationMiddleware(t *testing.T) {
	mockNext := &nextMock{}
	mockNext.On("ServeHTTP", mock.Anything, mock.Anything).Return()
	authMiddleware := middleware.FirebaseAuthMiddleware(mockNext)

	t.Run("returns Unauthorized for missing auth header and OTP", func(t *testing.T) {
		request := httptest.NewRequest(http.MethodGet, "/", nil)
		testRecorder := httptest.NewRecorder()

		authMiddleware.ServeHTTP(testRecorder, request)

		assert.Equal(t, http.StatusUnauthorized, testRecorder.Code)
	})

	t.Run("ParseFirebaseToken", func(t *testing.T) {
		t.Run("returns Unauthorized for auth header without proper prefix", func(t *testing.T) {
			request := httptest.NewRequest(http.MethodGet, "/", nil)
			request.Header.Set("Authorization", "APIkey 123")
			testRecorder := httptest.NewRecorder()

			authMiddleware.ServeHTTP(testRecorder, request)

			assert.Equal(t, http.StatusUnauthorized, testRecorder.Code)
		})

		t.Run("returns Unauthorized for token error raised by firebase", func(t *testing.T) {
			mockAuth := testutils.MockFirebaseAuth(t)

			mockAuth.On("VerifyIDToken", mock.Anything, "abc").
				Return(&auth.Token{}, fmt.Errorf("test"))

			request := httptest.NewRequest(http.MethodGet, "/", nil)
			request.Header.Set("Authorization", "Bearer abc")
			testRecorder := httptest.NewRecorder()

			authMiddleware.ServeHTTP(testRecorder, request)

			assert.Equal(t, http.StatusUnauthorized, testRecorder.Code)
			assert.Equal(t, 1, len(mockAuth.Calls))
		})

		t.Run("sets the user account in the request context on success", func(t *testing.T) {
			mockAuth := testutils.MockFirebaseAuth(t)

			mockAuth.On("VerifyIDToken", mock.Anything, "abc").Return(&auth.Token{UID: "123"}, nil)
			mockAuth.On("GetUser", mock.Anything, "123").Return(&auth.UserRecord{
				UserInfo: &auth.UserInfo{
					DisplayName: "Test User",
					Email:       "test@example.com",
					PhoneNumber: "123456789",
					PhotoURL:    "https://example.com/photo.jpg",
				},
			}, nil)

			request := httptest.NewRequest(http.MethodGet, "/", nil)
			request.Header.Set("Authorization", "Bearer abc")
			testRecorder := httptest.NewRecorder()

			authMiddleware.ServeHTTP(testRecorder, request)

			assert.Equal(t, http.StatusOK, testRecorder.Code)
			assert.Equal(t, 2, len(mockAuth.Calls))
			assert.Equal(t, 1, len(mockNext.Calls))

			newRequest := mockNext.Calls[0].Arguments.Get(1).(*http.Request)
			_, ok := newRequest.Context().Value(middleware.UserAccountContextKey).(*db.UserAccount)
			assert.True(t, ok)
		})
	})

	t.Run("parseOTP", func(t *testing.T) {
		userAccount, _ := factories.CreateUserAccount(context.TODO())
		project, _ := factories.CreateProject(context.TODO())
		_, _ = db.GetQueries().CreateUserProject(context.TODO(), db.CreateUserProjectParams{
			UserID:     userAccount.ID,
			ProjectID:  project.ID,
			Permission: db.AccessPermissionTypeADMIN,
		})

		r := router.New(router.Options{
			Environment:      "test",
			ServiceName:      "test",
			RegisterHandlers: api.RegisterHandlers,
			Middlewares: []func(next http.Handler) http.Handler{
				middleware.CreateMockFirebaseAuthMiddleware(userAccount),
			},
		})

		testClient := testutils.CreateTestHTTPClient(t, r)

		url := fmt.Sprintf(
			"/v1%s",
			strings.ReplaceAll(api.ProjectOTPEndpoint, "{projectId}", db.UUIDToString(&project.ID)),
		)

		t.Run("returns error on cfg error", func(t *testing.T) {
			testutils.SetTestEnv(t)
			response, err := testClient.Get(context.TODO(), url)
			assert.NoError(t, err)
			assert.Equal(t, http.StatusOK, response.StatusCode)

			data := dto.OtpDTO{}
			_ = serialization.DeserializeJSON(response.Body, &data)

			assert.NotEmpty(t, data.OTP)

			testutils.UnsetTestEnv(t)
			config.Set(nil)
			request := httptest.NewRequest(http.MethodGet, fmt.Sprintf("/?otp=%s", data.OTP), nil)
			testRecorder := httptest.NewRecorder()

			authMiddleware.ServeHTTP(testRecorder, request)
			assert.Equal(t, http.StatusInternalServerError, testRecorder.Code)
		})

		t.Run("returns error on jwt error", func(t *testing.T) {
			testutils.SetTestEnv(t)
			config.Set(nil)
			request := httptest.NewRequest(http.MethodGet, "/?otp=invalid", nil)
			testRecorder := httptest.NewRecorder()

			authMiddleware.ServeHTTP(testRecorder, request)
			assert.Equal(t, http.StatusUnauthorized, testRecorder.Code)
		})

		t.Run("returns error on missing sub", func(t *testing.T) {
			testutils.SetTestEnv(t)
			config.Set(nil)
			cfg, _ := config.Get(context.Background())
			jwt, _ := jwtutils.CreateJWT(time.Second, []byte(cfg.JWTSecret), "")

			request := httptest.NewRequest(http.MethodGet, fmt.Sprintf("/?otp=%s", jwt), nil)
			testRecorder := httptest.NewRecorder()

			authMiddleware.ServeHTTP(testRecorder, request)
			assert.Equal(t, http.StatusUnauthorized, testRecorder.Code)
		})

		t.Run("sets the user account in the request context on success", func(t *testing.T) {
			testutils.SetTestEnv(t)
			response, err := testClient.Get(context.TODO(), url)
			assert.NoError(t, err)
			assert.Equal(t, http.StatusOK, response.StatusCode)

			data := dto.OtpDTO{}
			_ = serialization.DeserializeJSON(response.Body, &data)

			assert.NotEmpty(t, data.OTP)

			request := httptest.NewRequest(http.MethodGet, fmt.Sprintf("/?otp=%s", data.OTP), nil)
			testRecorder := httptest.NewRecorder()

			authMiddleware.ServeHTTP(testRecorder, request)
			assert.Equal(t, http.StatusOK, testRecorder.Code)

			newRequest := mockNext.Calls[0].Arguments.Get(1).(*http.Request)
			_, ok := newRequest.Context().Value(middleware.UserAccountContextKey).(*db.UserAccount)
			assert.True(t, ok)
		})
	})
}

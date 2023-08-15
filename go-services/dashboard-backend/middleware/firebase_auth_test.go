package middleware_test

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/basemind-ai/backend-services/go-shared/firebaseutils/testutils"

	"firebase.google.com/go/v4/auth"
	"github.com/basemind-ai/backend-services/go-services/dashboard-backend/constants"

	"github.com/basemind-ai/backend-services/go-services/dashboard-backend/middleware"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type nextMock struct {
	mock.Mock
}

func (m *nextMock) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	m.Called(w, r)
}

func TestFirebaseAuthMiddlewareFailureScenarios(t *testing.T) {
	mockNext := &nextMock{}
	mockNext.On("ServeHTTP", mock.Anything, mock.Anything).Return()
	authMiddleware := middleware.FirebaseAuthMiddleware(mockNext)

	t.Run("returns Unauthorized for missing auth header", func(t *testing.T) {
		request := httptest.NewRequest("GET", "/", nil)
		testRecorder := httptest.NewRecorder()

		authMiddleware.ServeHTTP(testRecorder, request)

		assert.Equal(t, http.StatusUnauthorized, testRecorder.Code)
	})

	t.Run("returns Unauthorized for auth header without proper prefix", func(t *testing.T) {
		request := httptest.NewRequest("GET", "/", nil)
		request.Header.Set("Authorization", "Apikey 123")
		testRecorder := httptest.NewRecorder()

		authMiddleware.ServeHTTP(testRecorder, request)

		assert.Equal(t, http.StatusUnauthorized, testRecorder.Code)
	})

	t.Run("returns Unauthorized for token error raised by firebase", func(t *testing.T) {
		mockAuth := testutils.MockFirebaseAuth()

		mockAuth.On("VerifyIDToken", mock.Anything, "abc").Return(&auth.Token{}, fmt.Errorf("test"))

		request := httptest.NewRequest("GET", "/", nil)
		request.Header.Set("Authorization", "Bearer abc")
		testRecorder := httptest.NewRecorder()

		authMiddleware.ServeHTTP(testRecorder, request)

		assert.Equal(t, http.StatusUnauthorized, testRecorder.Code)
		assert.Equal(t, 1, len(mockAuth.Calls))
	})

	t.Run("sets the firebase UID in the request context on success", func(t *testing.T) {
		mockAuth := testutils.MockFirebaseAuth()

		mockAuth.On("VerifyIDToken", mock.Anything, "abc").Return(&auth.Token{UID: "123"}, nil)

		request := httptest.NewRequest("GET", "/", nil)
		request.Header.Set("Authorization", "Bearer abc")
		testRecorder := httptest.NewRecorder()

		authMiddleware.ServeHTTP(testRecorder, request)

		assert.Equal(t, http.StatusOK, testRecorder.Code)
		assert.Equal(t, 1, len(mockAuth.Calls))
		assert.Equal(t, 1, len(mockNext.Calls))

		newRequest := mockNext.Calls[0].Arguments.Get(1).(*http.Request)
		ctxValue := newRequest.Context().Value(constants.FireBaseIdContextKey)
		assert.Equal(t, ctxValue, "123")
	})
}

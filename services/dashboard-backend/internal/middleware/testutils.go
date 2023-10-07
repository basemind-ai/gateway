package middleware

import (
	"context"
	"net/http"
)

func CreateMockFirebaseAuthMiddleware(userID string) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := context.WithValue(r.Context(), FireBaseIDContextKey, userID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

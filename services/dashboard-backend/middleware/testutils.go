package middleware

import (
	"context"
	"net/http"
)

func CreateMockFirebaseAuthMiddleware(userId string) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := context.WithValue(r.Context(), FireBaseIdContextKey, userId)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

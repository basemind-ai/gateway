package middleware

import (
	"context"
	"github.com/basemind-ai/monorepo/shared/go/db/models"
	"net/http"
)

func CreateMockFirebaseAuthMiddleware(
	userAccount *models.UserAccount,
) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := context.WithValue(r.Context(), UserAccountContextKey, userAccount)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

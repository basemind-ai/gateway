package middleware

import (
	"context"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/repositories"
	"github.com/basemind-ai/monorepo/shared/go/apierror"
	"github.com/basemind-ai/monorepo/shared/go/firebaseutils"
	"net/http"
	"strings"

	"github.com/rs/zerolog/log"
)

type AuthContextKeyType int

const (
	UserAccountContextKey AuthContextKeyType = iota
)

func FirebaseAuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")

		if !strings.HasPrefix(authHeader, "Bearer ") {
			log.Error().Msg("malformed firebase auth header")
			apierror.Unauthorized("invalid auth header").Render(w, r)
			return
		}

		firebaseAuth := firebaseutils.GetFirebaseAuth(r.Context())

		token, tokenErr := firebaseAuth.
			VerifyIDToken(r.Context(), strings.Replace(authHeader, "Bearer ", "", 1))

		if tokenErr != nil {
			log.Error().Err(tokenErr).Msg("malformed firebase auth header")
			apierror.Unauthorized("invalid auth header").Render(w, r)
			return
		}

		userAccount, retrieveUserAccountErr := repositories.GetOrCreateUserAccount(
			r.Context(),
			token.UID,
		)
		if retrieveUserAccountErr != nil {
			log.Error().Err(retrieveUserAccountErr).Msg("failed to retrieve user account")
			apierror.InternalServerError("failed to get or create user account").Render(w, r)
			return
		}

		ctx := context.WithValue(r.Context(), UserAccountContextKey, userAccount)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

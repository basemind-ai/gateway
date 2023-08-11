package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/basemind-ai/backend-services/services/dashboard-backend/constants"

	"github.com/basemind-ai/backend-services/lib/apierror"
	"github.com/basemind-ai/backend-services/lib/firebaseutils"
	"github.com/rs/zerolog/log"
)

func FirebaseAuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")

		if !strings.HasPrefix(authHeader, "Bearer ") {
			log.Error().Msg("malformed firebase auth header")
			_ = apierror.Unauthorized("invalid auth header").Render(w, r)
			return
		}

		firebaseAuth := firebaseutils.GetFirebaseAuth(r.Context())

		token, tokenErr := firebaseAuth.
			VerifyIDToken(r.Context(), strings.Replace(authHeader, "Bearer ", "", 1))

		if tokenErr != nil {
			log.Error().Err(tokenErr).Msg("malformed firebase auth header")
			_ = apierror.Unauthorized("invalid auth header").Render(w, r)
			return
		}

		ctx := context.WithValue(r.Context(), constants.FireBaseIdContextKey, token.UID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

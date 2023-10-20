package middleware

import (
	"context"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/repositories"
	"github.com/basemind-ai/monorepo/shared/go/apierror"
	"github.com/basemind-ai/monorepo/shared/go/config"
	"github.com/basemind-ai/monorepo/shared/go/firebaseutils"
	"github.com/basemind-ai/monorepo/shared/go/jwtutils"
	"net/http"
	"strings"

	"github.com/rs/zerolog/log"
)

type authContextKeyType int

const (
	UserAccountContextKey authContextKeyType = iota
)

func parseOTP(r *http.Request, otp string) (string, *apierror.APIError) {
	cfg, cfgErr := config.Get(r.Context())
	if cfgErr != nil {
		log.Error().Err(cfgErr).Msg("failed to retrieve config")
		return "", apierror.InternalServerError()
	}
	parsedJwt, parseErr := jwtutils.ParseJWT(otp, []byte(cfg.JWTSecret))
	if parseErr != nil {
		log.Error().Err(parseErr).Msg("failed to parse jwt")
		return "", apierror.Unauthorized("invalid otp")
	}
	sub, subjectErr := parsedJwt.GetSubject()
	if subjectErr != nil || sub == "" {
		log.Error().Err(subjectErr).Msg("invalid jwt - missing sub")
		return "", apierror.Unauthorized("invalid otp")
	}
	return sub, nil
}

func parseFirebaseToken(r *http.Request, authHeader string) (string, *apierror.APIError) {
	if !strings.HasPrefix(authHeader, "Bearer ") {
		log.Error().Msg("malformed firebase auth header")
		return "", apierror.Unauthorized("invalid auth header")
	}

	firebaseAuth := firebaseutils.GetFirebaseAuth(r.Context())

	token, tokenErr := firebaseAuth.
		VerifyIDToken(r.Context(), strings.Replace(authHeader, "Bearer ", "", 1))

	if tokenErr != nil {
		log.Error().Err(tokenErr).Msg("malformed firebase auth header")
		return "", apierror.Unauthorized("invalid auth header")
	}

	return token.UID, nil
}

// FirebaseAuthMiddleware - middleware that verifies the firebase auth token and adds the user account to the context.
func FirebaseAuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var (
			firebaseID string
			apiError   *apierror.APIError
		)

		if otp := r.URL.Query().Get("otp"); otp != "" {
			firebaseID, apiError = parseOTP(r, otp)
		} else if authHeader := r.Header.Get("Authorization"); authHeader != "" {
			firebaseID, apiError = parseFirebaseToken(r, authHeader)
		} else {
			apiError = apierror.Unauthorized("missing auth header")
		}

		if apiError != nil {
			apiError.Render(w, r)
			return
		}

		userAccount, retrieveUserAccountErr := repositories.GetOrCreateUserAccount(
			r.Context(),
			firebaseID,
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

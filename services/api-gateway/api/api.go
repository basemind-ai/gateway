package api

import (
	"fmt"
	"github.com/basemind-ai/backend-services/services/api-gateway/config"
	"net/http"
	"strings"
	"time"

	"github.com/basemind-ai/backend-services/db"
	"github.com/basemind-ai/backend-services/lib/apiutils"
	"github.com/basemind-ai/backend-services/lib/firebaseutils"
	"github.com/basemind-ai/backend-services/lib/jwtutils"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/render"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/rs/zerolog/log"
)

const (
	GetTokenEndpoint = "/firebase-login"
)

func pgUUIDToString(value pgtype.UUID) string {
	return fmt.Sprintf("%x-%x-%x-%x-%x", value.Bytes[0:4], value.Bytes[4:6], value.Bytes[6:8], value.Bytes[8:10], value.Bytes[10:16])
}

type TokenReponse struct {
	Token string `json:"token"`
}

func CreateFireBaseLoginHandler(jwtSecret string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")

		if !strings.HasPrefix(authHeader, "Bearer ") {
			log.Error().Msg("malformed firebase auth header")
			_ = render.Render(w, r, apiutils.Unauthorized("invalid auth header"))
			return
		}

		firebaseAuth := firebaseutils.GetFirebaseAuth(r.Context())
		token, tokenErr := firebaseAuth.VerifyIDToken(r.Context(), strings.Replace(authHeader, "Bearer ", "", 1))
		if tokenErr != nil {
			log.Error().Err(tokenErr).Msg("malformed firebase auth header")
			_ = render.Render(w, r, apiutils.Unauthorized("invalid auth header"))
			return
		}

		authUser, authErr := firebaseAuth.GetUser(r.Context(), token.UID)
		if authErr != nil {
			log.Error().Err(authErr).Msg("failed to retrieve firebase user")
			_ = render.Render(w, r, apiutils.InternalServerError("failed to retrieve user"))
			return
		}

		userId, dbErr := db.GetQueries().UpsertUser(r.Context(),
			db.UpsertUserParams{
				FirebaseID:  authUser.UID,
				DisplayName: authUser.DisplayName,
				Email:       authUser.Email,
				PhoneNumber: authUser.PhoneNumber,
				PhotoUrl:    authUser.PhotoURL,
				ProviderID:  authUser.ProviderID,
			},
		)

		if dbErr != nil {
			log.Error().Err(dbErr).Msg("failed to upsert user")
			_ = render.Render(w, r, apiutils.InternalServerError("database error"))
			return
		}

		jwtToken, jwtTokenErr := jwtutils.CreateToken(
			pgUUIDToString(userId), time.Now().Add(2*time.Hour), jwtSecret,
		)

		if jwtTokenErr != nil {
			log.Error().Err(jwtTokenErr).Msg("failed to create JWT")
			_ = render.Render(w, r, apiutils.InternalServerError(""))
			return
		}

		render.Status(r, http.StatusOK)
		render.JSON(w, r, TokenReponse{Token: jwtToken})
	}
}

func RegisterHandlers(mux *chi.Mux, cfg config.Config) {
	mux.Route("/v1", func(r chi.Router) {
		r.Get(GetTokenEndpoint, CreateFireBaseLoginHandler(cfg.JWTSecret))
	})
}

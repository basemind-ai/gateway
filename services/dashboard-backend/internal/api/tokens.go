package api

import (
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/dto"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/middleware"
	"github.com/basemind-ai/monorepo/shared/go/apierror"
	"github.com/basemind-ai/monorepo/shared/go/config"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/jwtutils"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/rs/zerolog/log"
	"net/http"
)

// HandleCreateApplicationToken - creates a new application token.
func HandleCreateApplicationToken(w http.ResponseWriter, r *http.Request) {
	applicationId := r.Context().Value(middleware.ApplicationIdContextKey).(pgtype.UUID)

	data := &dto.ApplicationTokenDTO{}
	if deserializationErr := serialization.DeserializeJson(r.Body, data); deserializationErr != nil {
		apierror.BadRequest(InvalidRequestBodyError).Render(w, r)
		return
	}

	if validationErr := validate.Struct(data); validationErr != nil {
		apierror.BadRequest(validationErr.Error()).Render(w, r)
		return
	}

	tx, txErr := db.GetTransaction(r.Context())
	if txErr != nil {
		log.Error().Err(txErr).Msg("failed to create transaction")
		apierror.InternalServerError().Render(w, r)
		return
	}

	queries := db.GetQueries()

	token, createTokenErr := queries.CreateToken(r.Context(), db.CreateTokenParams{
		ApplicationID: applicationId,
		Name:          data.Name,
	})
	if createTokenErr != nil {
		log.Error().Err(createTokenErr).Msg("failed to create application token")
		apierror.InternalServerError().Render(w, r)
		return
	}

	tokenId := db.UUIDToString(&token.ID)
	cfg, configErr := db.WithRollback(
		tx,
		func() (config.Config, error) { return config.Get(r.Context()) },
	)
	if configErr != nil {
		log.Error().Err(configErr).Msg("failed to retrieve config")
		apierror.InternalServerError().Render(w, r)
		return
	}
	jwt, jwtErr := db.WithRollback(
		tx,
		func() (string, error) { return jwtutils.CreateJWT(-1, []byte(cfg.JWTSecret), tokenId) },
	)
	if jwtErr != nil {
		log.Error().Err(jwtErr).Msg("failed to create jwt")
		apierror.InternalServerError().Render(w, r)
		return
	}

	if commitErr := tx.Commit(r.Context()); commitErr != nil {
		log.Error().Err(commitErr).Msg("failed to commit transaction")
		apierror.InternalServerError().Render(w, r)
		return
	}

	serialization.RenderJsonResponse(w, http.StatusCreated, &dto.ApplicationTokenDTO{
		ID:        tokenId,
		CreatedAt: token.CreatedAt.Time,
		Name:      token.Name,
		Hash:      jwt,
	})
}

// HandleRetrieveApplicationTokens - retrieves a list of all applications tokens.
func HandleRetrieveApplicationTokens(w http.ResponseWriter, r *http.Request) {
	applicationId := r.Context().Value(middleware.ApplicationIdContextKey).(pgtype.UUID)

	tokens, retrievalErr := db.GetQueries().RetrieveApplicationTokens(r.Context(), applicationId)
	if retrievalErr != nil {
		log.Error().Err(retrievalErr).Msg("failed to retrieve application tokens")
		apierror.InternalServerError().Render(w, r)
		return
	}

	ret := make([]*dto.ApplicationTokenDTO, 0)
	for _, token := range tokens {
		tokenId := token.ID
		ret = append(ret, &dto.ApplicationTokenDTO{
			ID:        db.UUIDToString(&tokenId),
			CreatedAt: token.CreatedAt.Time,
			Name:      token.Name,
		})
	}

	serialization.RenderJsonResponse(w, http.StatusOK, ret)
}

// HandleDeleteApplicationToken - deletes an application token.
func HandleDeleteApplicationToken(w http.ResponseWriter, r *http.Request) {
	tokenId := r.Context().Value(middleware.TokenIdContextKey).(pgtype.UUID)

	if err := db.GetQueries().DeleteToken(r.Context(), tokenId); err != nil {
		log.Error().Err(err).Msg("failed to delete application token")
		apierror.InternalServerError().Render(w, r)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

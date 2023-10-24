package api

import (
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/dto"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/middleware"
	"github.com/basemind-ai/monorepo/shared/go/apierror"
	"github.com/basemind-ai/monorepo/shared/go/config"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/exc"
	"github.com/basemind-ai/monorepo/shared/go/jwtutils"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/rs/zerolog/log"
	"net/http"
)

// handleCreateApplicationToken - creates a new application token.
func handleCreateApplicationToken(w http.ResponseWriter, r *http.Request) {
	applicationID := r.Context().Value(middleware.ApplicationIDContextKey).(pgtype.UUID)

	data := &dto.ApplicationTokenDTO{}
	if deserializationErr := serialization.DeserializeJSON(r.Body, data); deserializationErr != nil {
		apierror.BadRequest(invalidRequestBodyError).Render(w, r)
		return
	}

	if validationErr := validate.Struct(data); validationErr != nil {
		apierror.BadRequest(validationErr.Error()).Render(w, r)
		return
	}

	tx := exc.MustResult(db.GetTransaction(r.Context()))

	defer func() {
		if rollbackErr := tx.Rollback(r.Context()); rollbackErr != nil {
			log.Error().Err(rollbackErr).Msg("failed to rollback transaction")
		}
	}()

	queries := db.GetQueries()

	token, createTokenErr := queries.CreateToken(r.Context(), db.CreateTokenParams{
		ApplicationID: applicationID,
		Name:          data.Name,
	})
	if createTokenErr != nil {
		log.Error().Err(createTokenErr).Msg("failed to create application token")
		apierror.InternalServerError().Render(w, r)
		return
	}

	tokenID := db.UUIDToString(&token.ID)
	cfg := config.Get(r.Context())

	jwt, jwtErr := jwtutils.CreateJWT(-1, []byte(cfg.JWTSecret), tokenID)
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

	serialization.RenderJSONResponse(w, http.StatusCreated, &dto.ApplicationTokenDTO{
		ID:        tokenID,
		CreatedAt: token.CreatedAt.Time,
		Name:      token.Name,
		Hash:      &jwt,
	})
}

// handleRetrieveApplicationTokens - retrieves a list of all applications tokens.
func handleRetrieveApplicationTokens(w http.ResponseWriter, r *http.Request) {
	applicationID := r.Context().Value(middleware.ApplicationIDContextKey).(pgtype.UUID)

	tokens := exc.MustResult(db.GetQueries().RetrieveTokens(r.Context(), applicationID))

	ret := make([]*dto.ApplicationTokenDTO, 0)
	for _, token := range tokens {
		tokenID := token.ID
		ret = append(ret, &dto.ApplicationTokenDTO{
			ID:        db.UUIDToString(&tokenID),
			CreatedAt: token.CreatedAt.Time,
			Name:      token.Name,
		})
	}

	serialization.RenderJSONResponse(w, http.StatusOK, ret)
}

// handleDeleteApplicationToken - deletes an application token.
func handleDeleteApplicationToken(w http.ResponseWriter, r *http.Request) {
	tokenID := r.Context().Value(middleware.TokenIDContextKey).(pgtype.UUID)

	exc.Must(db.GetQueries().DeleteToken(r.Context(), tokenID))

	w.WriteHeader(http.StatusNoContent)
}

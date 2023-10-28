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

// handleCreateApplicationAPIKey - creates a new application apiKey.
func handleCreateApplicationAPIKey(w http.ResponseWriter, r *http.Request) {
	applicationID := r.Context().Value(middleware.ApplicationIDContextKey).(pgtype.UUID)

	data := &dto.ApplicationAPIKeyDTO{}
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

	apiKey, createAPIKeyErr := queries.CreateAPIKey(r.Context(), db.CreateAPIKeyParams{
		ApplicationID: applicationID,
		Name:          data.Name,
	})
	if createAPIKeyErr != nil {
		log.Error().Err(createAPIKeyErr).Msg("failed to create application apiKey")
		apierror.InternalServerError().Render(w, r)
		return
	}

	apiKeyID := db.UUIDToString(&apiKey.ID)
	cfg := config.Get(r.Context())

	jwt, jwtErr := jwtutils.CreateJWT(-1, []byte(cfg.JWTSecret), apiKeyID)
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

	serialization.RenderJSONResponse(w, http.StatusCreated, &dto.ApplicationAPIKeyDTO{
		ID:        apiKeyID,
		CreatedAt: apiKey.CreatedAt.Time,
		Name:      apiKey.Name,
		Hash:      &jwt,
	})
}

// handleRetrieveApplicationAPIKeys - retrieves a list of all applications apiKeys.
func handleRetrieveApplicationAPIKeys(w http.ResponseWriter, r *http.Request) {
	applicationID := r.Context().Value(middleware.ApplicationIDContextKey).(pgtype.UUID)

	apiKeys := exc.MustResult(db.GetQueries().RetrieveAPIKeys(r.Context(), applicationID))

	ret := make([]*dto.ApplicationAPIKeyDTO, 0)
	for _, apiKey := range apiKeys {
		apiKeyID := apiKey.ID
		ret = append(ret, &dto.ApplicationAPIKeyDTO{
			ID:        db.UUIDToString(&apiKeyID),
			CreatedAt: apiKey.CreatedAt.Time,
			Name:      apiKey.Name,
		})
	}

	serialization.RenderJSONResponse(w, http.StatusOK, ret)
}

// handleDeleteApplicationAPIKey - deletes an application apiKey.
func handleDeleteApplicationAPIKey(w http.ResponseWriter, r *http.Request) {
	apiKeyID := r.Context().Value(middleware.APIKeyIDContextKey).(pgtype.UUID)

	exc.Must(db.GetQueries().DeleteAPIKey(r.Context(), apiKeyID))

	w.WriteHeader(http.StatusNoContent)
}

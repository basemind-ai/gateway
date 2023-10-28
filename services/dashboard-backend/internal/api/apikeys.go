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

	apiKey := exc.MustResult(db.GetQueries().CreateAPIKey(r.Context(), db.CreateAPIKeyParams{
		ApplicationID: applicationID,
		Name:          data.Name,
	}))

	apiKeyID := db.UUIDToString(&apiKey.ID)
	cfg := config.Get(r.Context())

	jwt := exc.MustResult(jwtutils.CreateJWT(-1, []byte(cfg.JWTSecret), apiKeyID))

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

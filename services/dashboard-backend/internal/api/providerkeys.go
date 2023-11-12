package api

import (
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/dto"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/middleware"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/repositories"
	"github.com/basemind-ai/monorepo/shared/go/apierror"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/exc"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"github.com/jackc/pgx/v5/pgtype"
	"net/http"
)

// handleRetrieveProviderKeys - retrieves the provider keys stored for a given project.
func handleRetrieveProviderKeys(w http.ResponseWriter, r *http.Request) {
	projectID := r.Context().Value(middleware.ProjectIDContextKey).(pgtype.UUID)

	results := exc.MustResult(db.GetQueries().RetrieveProjectProviderKeys(r.Context(), projectID))

	data := make([]*dto.ProviderKeyDTO, len(results))
	for i, result := range results {
		id := result.ID

		data[i] = &dto.ProviderKeyDTO{
			ID:          db.UUIDToString(&id),
			ModelVendor: result.ModelVendor,
			CreatedAt:   result.CreatedAt.Time,
		}
	}

	serialization.RenderJSONResponse(w, http.StatusOK, data)
}

// handleCreateProviderKey - creates a new provider key for the given project.
func handleCreateProviderKey(w http.ResponseWriter, r *http.Request) {
	projectID := r.Context().Value(middleware.ProjectIDContextKey).(pgtype.UUID)

	data := dto.ProviderKeyCreateDTO{}
	if err := serialization.DeserializeJSON(r.Body, &data); err != nil {
		apierror.BadRequest(invalidRequestBodyError).Render(w)
		return
	}

	if validationErr := validate.Struct(data); validationErr != nil {
		apierror.BadRequest(validationErr.Error()).Render(w)
		return
	}

	created, createErr := repositories.CreateProviderKey(r.Context(), projectID, data)
	if createErr != nil {
		apierror.BadRequest("only a single api-key per model vendor is allowed").Render(w)
		return
	}

	serialization.RenderJSONResponse(w, http.StatusCreated, created)
}

// handleDeleteProviderKey - deletes a provider key for the given project.
func handleDeleteProviderKey(w http.ResponseWriter, r *http.Request) {
	providerKeyID := r.Context().Value(middleware.ProviderKeyIDContextKey).(pgtype.UUID)

	exc.Must(db.GetQueries().DeleteProviderKey(r.Context(), providerKeyID))

	w.WriteHeader(http.StatusNoContent)
}

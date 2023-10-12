package api

import (
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/dto"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/middleware"
	"github.com/basemind-ai/monorepo/shared/go/apierror"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/rediscache"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/rs/zerolog/log"
	"net/http"
)

// HandleCreateApplication - create a new application .
func HandleCreateApplication(w http.ResponseWriter, r *http.Request) {
	projectID := r.Context().Value(middleware.ProjectIDContextKey).(pgtype.UUID)

	data := &db.CreateApplicationParams{
		ProjectID: projectID,
	}
	if deserializationErr := serialization.DeserializeJSON(r.Body, data); deserializationErr != nil {
		log.Error().Err(deserializationErr).Msg("failed to deserialize request body")
		apierror.BadRequest(InvalidRequestBodyError).Render(w, r)
		return
	}

	if data.Name == "" {
		apierror.BadRequest("application name is either missing or empty").Render(w, r)
		return
	}

	application, createApplicationErr := db.GetQueries().CreateApplication(r.Context(), *data)
	if createApplicationErr != nil {
		log.Error().Err(createApplicationErr).Msg("failed to create application")
		apierror.InternalServerError().Render(w, r)
		return
	}

	serialization.RenderJSONResponse(w, http.StatusCreated, dto.ApplicationDTO{
		ID:          db.UUIDToString(&application.ID),
		Name:        application.Name,
		Description: application.Description,
		CreatedAt:   application.CreatedAt.Time,
		UpdatedAt:   application.UpdatedAt.Time,
	})
}

// HandleRetrieveApplication - retrieve an application by ID.
func HandleRetrieveApplication(w http.ResponseWriter, r *http.Request) {
	applicationID := r.Context().Value(middleware.ApplicationIDContextKey).(pgtype.UUID)

	application, applicationRetrieveErr := db.
		GetQueries().
		RetrieveApplication(r.Context(), applicationID)

	if applicationRetrieveErr != nil {
		log.Error().Err(applicationRetrieveErr).Msg("failed to retrieve application")
		apierror.InternalServerError().Render(w, r)
		return
	}
	serialization.RenderJSONResponse(w, http.StatusOK, dto.ApplicationDTO{
		ID:          db.UUIDToString(&application.ID),
		Name:        application.Name,
		Description: application.Description,
		CreatedAt:   application.CreatedAt.Time,
		UpdatedAt:   application.UpdatedAt.Time,
	})
}

// HandleUpdateApplication - update an application.
func HandleUpdateApplication(w http.ResponseWriter, r *http.Request) {
	applicationID := r.Context().Value(middleware.ApplicationIDContextKey).(pgtype.UUID)

	data := &db.UpdateApplicationParams{
		ID: applicationID,
	}
	if deserializationErr := serialization.DeserializeJSON(r.Body, data); deserializationErr != nil {
		log.Error().Err(deserializationErr).Msg("failed to deserialize request body")
		apierror.BadRequest(InvalidRequestBodyError).Render(w, r)
		return
	}

	if data.Name == "" {
		apierror.BadRequest("application name is either missing or empty").Render(w, r)
		return
	}

	application, applicationUpdateError := db.GetQueries().UpdateApplication(r.Context(), *data)
	if applicationUpdateError != nil {
		log.Error().Err(applicationUpdateError).Msg("failed to update application")
		apierror.InternalServerError().Render(w, r)
		return
	}

	go func() {
		rediscache.Invalidate(r.Context(), db.UUIDToString(&application.ID))
	}()

	serialization.RenderJSONResponse(w, http.StatusOK, dto.ApplicationDTO{
		ID:          db.UUIDToString(&application.ID),
		Name:        application.Name,
		Description: application.Description,
		CreatedAt:   application.CreatedAt.Time,
		UpdatedAt:   application.UpdatedAt.Time,
	})
}

// HandleDeleteApplication - delete an application.
func HandleDeleteApplication(w http.ResponseWriter, r *http.Request) {
	applicationID := r.Context().Value(middleware.ApplicationIDContextKey).(pgtype.UUID)

	if applicationDeleteErr := db.GetQueries().DeleteApplication(r.Context(), applicationID); applicationDeleteErr != nil {
		log.Error().Err(applicationDeleteErr).Msg("failed to delete application")
		apierror.InternalServerError().Render(w, r)
		return
	}

	go func() {
		rediscache.Invalidate(r.Context(), db.UUIDToString(&applicationID))
	}()

	w.WriteHeader(http.StatusNoContent)
}

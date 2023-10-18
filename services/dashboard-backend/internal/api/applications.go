package api

import (
	"net/http"
	"time"

	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/dto"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/middleware"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/repositories"
	"github.com/basemind-ai/monorepo/shared/go/apierror"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/rediscache"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"github.com/basemind-ai/monorepo/shared/go/timeutils"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/rs/zerolog/log"
)

// handleCreateApplication - create a new application .
func handleCreateApplication(w http.ResponseWriter, r *http.Request) {
	projectID := r.Context().Value(middleware.ProjectIDContextKey).(pgtype.UUID)

	data := &db.CreateApplicationParams{
		ProjectID: projectID,
	}
	if deserializationErr := serialization.DeserializeJSON(r.Body, data); deserializationErr != nil {
		log.Error().Err(deserializationErr).Msg("failed to deserialize request body")
		apierror.BadRequest(invalidRequestBodyError).Render(w, r)
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

// handleRetrieveApplications - retrieve applications of a project.
func handleRetrieveApplications(w http.ResponseWriter, r *http.Request) {
	projectID := r.Context().Value(middleware.ProjectIDContextKey).(pgtype.UUID)

	applications, applicationsRetrieveErr := db.
		GetQueries().
		RetrieveApplications(r.Context(), projectID)

	if applicationsRetrieveErr != nil {
		log.Error().Err(applicationsRetrieveErr).Msg("failed to retrieve applications")
		apierror.InternalServerError().Render(w, r)
		return
	}

	data := make([]dto.ApplicationDTO, len(applications))
	for i, application := range applications {
		data[i] = dto.ApplicationDTO{
			ID:          db.UUIDToString(&application.ID),
			Name:        application.Name,
			Description: application.Description,
			CreatedAt:   application.CreatedAt.Time,
			UpdatedAt:   application.UpdatedAt.Time,
		}
	}
	serialization.RenderJSONResponse(w, http.StatusOK, data)
}

// handleRetrieveApplication - retrieve an application by ID.
func handleRetrieveApplication(w http.ResponseWriter, r *http.Request) {
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

// handleUpdateApplication - update an application.
func handleUpdateApplication(w http.ResponseWriter, r *http.Request) {
	applicationID := r.Context().Value(middleware.ApplicationIDContextKey).(pgtype.UUID)

	data := &db.UpdateApplicationParams{
		ID: applicationID,
	}
	if deserializationErr := serialization.DeserializeJSON(r.Body, data); deserializationErr != nil {
		log.Error().Err(deserializationErr).Msg("failed to deserialize request body")
		apierror.BadRequest(invalidRequestBodyError).Render(w, r)
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

// handleDeleteApplication - delete an application.
func handleDeleteApplication(w http.ResponseWriter, r *http.Request) {
	applicationID := r.Context().Value(middleware.ApplicationIDContextKey).(pgtype.UUID)

	if applicationDeleteErr := repositories.DeleteApplication(r.Context(), applicationID); applicationDeleteErr != nil {
		log.Error().Err(applicationDeleteErr).Msg("failed to delete application")
		apierror.InternalServerError().Render(w, r)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func handleRetrieveApplicationAnalytics(w http.ResponseWriter, r *http.Request) {
	applicationID := r.Context().Value(middleware.ApplicationIDContextKey).(pgtype.UUID)

	toDate := timeutils.ParseDate(r.URL.Query().Get("toDate"), time.Now())
	fromDate := timeutils.ParseDate(r.URL.Query().Get("fromDate"), timeutils.GetFirstDayOfMonth())

	promptAnalytics, promptErr := repositories.GetPromptRequestAnalyticsByDateRange(
		r.Context(),
		applicationID,
		fromDate,
		toDate,
	)
	if promptErr != nil {
		log.Error().Err(promptErr).Msg("failed to retrieve prompt analytics")
		apierror.InternalServerError().Render(w, r)
		return
	}

	w.WriteHeader(http.StatusOK)
	serialization.RenderJSONResponse(w, http.StatusOK, promptAnalytics)
}

package api

import (
	"github.com/basemind-ai/monorepo/shared/go/exc"
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
		apierror.BadRequest(invalidRequestBodyError).Render(w)
		return
	}
	if data.Name == "" {
		apierror.BadRequest("application name is either missing or empty").Render(w)
		return
	}

	application := exc.MustResult(db.GetQueries().CreateApplication(r.Context(), *data))

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

	applications := exc.MustResult(db.
		GetQueries().
		RetrieveApplications(r.Context(), projectID))

	data := make([]dto.ApplicationDTO, len(applications))
	for i, application := range applications {
		appID := application.ID
		data[i] = dto.ApplicationDTO{
			ID:          db.UUIDToString(&appID),
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
		apierror.BadRequest(invalidIDError).Render(w)
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
		apierror.BadRequest(invalidRequestBodyError).Render(w)
		return
	}

	if data.Name == "" {
		apierror.BadRequest("application name is either missing or empty").Render(w)
		return
	}

	application := exc.MustResult(db.GetQueries().UpdateApplication(r.Context(), *data))

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

	exc.Must(repositories.DeleteApplication(r.Context(), applicationID))

	w.WriteHeader(http.StatusNoContent)
}

func handleRetrieveApplicationAnalytics(w http.ResponseWriter, r *http.Request) {
	applicationID := r.Context().Value(middleware.ApplicationIDContextKey).(pgtype.UUID)

	toDate := timeutils.ParseDate(r.URL.Query().Get("toDate"), time.Now())
	fromDate := timeutils.ParseDate(r.URL.Query().Get("fromDate"), timeutils.GetFirstDayOfMonth())

	promptAnalytics := repositories.GetApplicationAnalyticsByDateRange(
		r.Context(),
		applicationID,
		fromDate,
		toDate,
	)

	w.WriteHeader(http.StatusOK)
	serialization.RenderJSONResponse(w, http.StatusOK, promptAnalytics)
}

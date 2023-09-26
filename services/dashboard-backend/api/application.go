package api

import (
	"github.com/basemind-ai/monorepo/shared/go/apierror"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"github.com/go-chi/chi/v5"
	"github.com/rs/zerolog/log"
	"net/http"
)

func HandleCreateApplication(w http.ResponseWriter, r *http.Request) {
	projectId, uuidErr := db.CreateUUIDFromString(chi.URLParam(r, "projectId"))
	if uuidErr != nil {
		_ = apierror.BadRequest(InvalidProjectIdError).Render(w, r)
		return
	}

	data := &db.CreateApplicationParams{
		ProjectID: *projectId,
	}
	if deserializationErr := serialization.DeserializeJson(r.Body, data); deserializationErr != nil {
		log.Error().Err(deserializationErr).Msg("failed to deserialize request body")
		_ = apierror.BadRequest(InvalidRequestBodyError).Render(w, r)
		return
	}

	if data.Name == "" {
		_ = apierror.BadRequest("application name is either missing or empty").Render(w, r)
		return
	}

	application, createApplicationErr := db.GetQueries().CreateApplication(r.Context(), *data)
	if createApplicationErr != nil {
		log.Error().Err(createApplicationErr).Msg("failed to create application")
		_ = apierror.InternalServerError().Render(w, r)
		return
	}

	_ = serialization.RenderJsonResponse(w, http.StatusCreated, application)
}

func HandleRetrieveApplication(w http.ResponseWriter, r *http.Request) {
	applicationId, uuidErr := db.CreateUUIDFromString(chi.URLParam(r, "applicationId"))
	if uuidErr != nil {
		_ = apierror.BadRequest(InvalidApplicationIdError).Render(w, r)
		return
	}

	application, applicationRetrieveErr := db.GetQueries().FindApplicationById(r.Context(), *applicationId)
	if applicationRetrieveErr != nil {
		log.Error().Err(applicationRetrieveErr).Msg("failed to retrieve application")
		_ = apierror.InternalServerError().Render(w, r)
		return
	}
	_ = serialization.RenderJsonResponse(w, http.StatusOK, application)
}

func HandleUpdateApplication(w http.ResponseWriter, r *http.Request) {
	applicationId, uuidErr := db.CreateUUIDFromString(chi.URLParam(r, "applicationId"))
	if uuidErr != nil {
		_ = apierror.BadRequest(InvalidApplicationIdError).Render(w, r)
		return
	}

	data := &db.UpdateApplicationParams{
		ID: *applicationId,
	}
	if deserializationErr := serialization.DeserializeJson(r.Body, data); deserializationErr != nil {
		log.Error().Err(deserializationErr).Msg("failed to deserialize request body")
		_ = apierror.BadRequest(InvalidRequestBodyError).Render(w, r)
		return
	}

	if data.Name == "" {
		_ = apierror.BadRequest("application name is either missing or empty").Render(w, r)
		return
	}

	application, applicationUpdateError := db.GetQueries().UpdateApplication(r.Context(), *data)
	if applicationUpdateError != nil {
		log.Error().Err(applicationUpdateError).Msg("failed to update application")
		_ = apierror.InternalServerError().Render(w, r)
		return
	}

	_ = serialization.RenderJsonResponse(w, http.StatusOK, application)
}

func HandleDeleteApplication(w http.ResponseWriter, r *http.Request) {
	applicationId, uuidErr := db.CreateUUIDFromString(chi.URLParam(r, "applicationId"))
	if uuidErr != nil {
		_ = apierror.BadRequest(InvalidApplicationIdError).Render(w, r)
		return
	}

	if applicationDeleteErr := db.GetQueries().DeleteApplication(r.Context(), *applicationId); applicationDeleteErr != nil {
		log.Error().Err(applicationDeleteErr).Msg("failed to delete application")
		_ = apierror.InternalServerError().Render(w, r)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

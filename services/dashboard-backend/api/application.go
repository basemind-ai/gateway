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
		log.Debug().Err(uuidErr).Msg("invalid projectId received")
		_ = apierror.BadRequest("projectId is not a valid UUID value").Render(w, r)
		return
	}

	data := &db.CreateApplicationParams{
		ProjectID: *projectId,
	}
	if deserializationErr := serialization.DeserializeJson(r.Body, data); deserializationErr != nil {
		log.Error().Err(deserializationErr).Msg("failed to deserialize request body")
		_ = apierror.BadRequest("invalid request body").Render(w, r)
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
		log.Debug().Err(uuidErr).Msg("invalid applicationId received")
		_ = apierror.BadRequest("applicationId is not a valid UUID value").Render(w, r)
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

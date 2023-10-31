package api

import (
	"github.com/basemind-ai/monorepo/shared/go/exc"
	"net/http"
	"strings"
	"time"

	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/dto"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/middleware"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/repositories"
	"github.com/basemind-ai/monorepo/shared/go/apierror"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"github.com/basemind-ai/monorepo/shared/go/timeutils"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/rs/zerolog/log"
)

// handleCreatePromptConfig - creates a prompt config for the given application.
// The first prompt config created for an application is automatically set as the default.
func handleCreatePromptConfig(w http.ResponseWriter, r *http.Request) {
	applicationID := r.Context().Value(middleware.ApplicationIDContextKey).(pgtype.UUID)

	createPromptConfigDTO := dto.PromptConfigCreateDTO{}
	if deserializationErr := serialization.DeserializeJSON(r.Body, &createPromptConfigDTO); deserializationErr != nil {
		log.Error().Err(deserializationErr).Msg("failed to deserialize request body")
		apierror.BadRequest(invalidRequestBodyError).Render(w)
		return
	}

	if validateErr := validate.Struct(&createPromptConfigDTO); validateErr != nil {
		log.Error().Err(validateErr).Msg("invalid request")
		apierror.BadRequest(invalidRequestBodyError).Render(w)
		return
	}

	promptConfig, createErr := repositories.CreatePromptConfig(
		r.Context(),
		applicationID,
		createPromptConfigDTO,
	)

	if createErr != nil {
		apiErr := apierror.InternalServerError()

		if strings.Contains(createErr.Error(), "duplicate key value violates unique constraint") {
			apiErr = apierror.BadRequest(createErr.Error())
		}

		log.Error().Err(createErr).Msg("failed to create prompt config")
		apiErr.Render(w)
		return
	}

	serialization.RenderJSONResponse(w, http.StatusCreated, promptConfig)
}

// handleRetrievePromptConfigs - retrieves all prompt configs for the given application.
func handleRetrievePromptConfigs(w http.ResponseWriter, r *http.Request) {
	applicationID := r.Context().Value(middleware.ApplicationIDContextKey).(pgtype.UUID)

	promptConfigs := exc.MustResult(db.
		GetQueries().
		RetrievePromptConfigs(r.Context(), applicationID))

	serialization.RenderJSONResponse(w, http.StatusOK, promptConfigs)
}
func handleUpdatePromptConfig(w http.ResponseWriter, r *http.Request) {
	promptConfigID := r.Context().Value(middleware.PromptConfigIDContextKey).(pgtype.UUID)

	updatePromptConfigDTO := &dto.PromptConfigUpdateDTO{}
	if deserializationErr := serialization.DeserializeJSON(r.Body, updatePromptConfigDTO); deserializationErr != nil {
		log.Error().Err(deserializationErr).Msg("failed to deserialize request body")
		apierror.BadRequest(invalidRequestBodyError).Render(w)
		return
	}

	if validateErr := validate.Struct(updatePromptConfigDTO); validateErr != nil {
		log.Error().Err(validateErr).Msg("invalid request")
		apierror.BadRequest(invalidRequestBodyError).Render(w)
		return
	}

	updatedPromptConfig, updatePromptConfigErr := repositories.UpdatePromptConfig(
		r.Context(), promptConfigID, *updatePromptConfigDTO,
	)

	if updatePromptConfigErr != nil {
		apiErr := apierror.InternalServerError()
		if strings.Contains(
			updatePromptConfigErr.Error(),
			"duplicate key value violates unique constraint",
		) {
			apiErr = apierror.BadRequest(updatePromptConfigErr.Error())
		}
		log.Error().Err(updatePromptConfigErr).Msg("failed to update prompt config")
		apiErr.Render(w)
		return
	}

	serialization.RenderJSONResponse(w, http.StatusOK, updatedPromptConfig)
}

// handleSetApplicationDefaultPromptConfig - sets the default prompt config for the given application.
// The default prompt config is used when no prompt config is specified in a prompt request.
func handleSetApplicationDefaultPromptConfig(w http.ResponseWriter, r *http.Request) {
	applicationID := r.Context().Value(middleware.ApplicationIDContextKey).(pgtype.UUID)
	promptConfigID := r.Context().Value(middleware.PromptConfigIDContextKey).(pgtype.UUID)

	updateErr := repositories.UpdateApplicationDefaultPromptConfig(
		r.Context(),
		applicationID,
		promptConfigID,
	)
	if updateErr != nil {
		apiErr := apierror.InternalServerError()
		if strings.Contains(updateErr.Error(), "is already the default") {
			apiErr = apierror.BadRequest(updateErr.Error())
		}
		log.Error().Err(updateErr).Msg("failed to create prompt config")
		apiErr.Render(w)
		return
	}

	serialization.RenderJSONResponse(w, http.StatusOK, nil)
}

// handleDeletePromptConfig - deletes the prompt config with the given ID.
// The default prompt config cannot be deleted.
func handleDeletePromptConfig(w http.ResponseWriter, r *http.Request) {
	applicationID := r.Context().Value(middleware.ApplicationIDContextKey).(pgtype.UUID)
	promptConfigID := r.Context().Value(middleware.PromptConfigIDContextKey).(pgtype.UUID)

	promptConfig, retrievePromptConfigErr := db.GetQueries().
		RetrievePromptConfig(r.Context(), promptConfigID)

	if retrievePromptConfigErr != nil {
		log.Error().Err(retrievePromptConfigErr).Msg("failed to retrieve prompt config")
		apierror.BadRequest("prompt config with the given ID does not exist").Render(w)
		return
	}

	if promptConfig.IsDefault {
		apierror.BadRequest("cannot delete the default prompt config").Render(w)
		return
	}

	exc.Must(repositories.DeletePromptConfig(r.Context(), applicationID, promptConfigID))

	w.WriteHeader(http.StatusNoContent)
}

// handlePromptConfigAnalytics - retrieves the analytics for a prompt config with the given ID.
func handlePromptConfigAnalytics(w http.ResponseWriter, r *http.Request) {
	promptConfigID := r.Context().Value(middleware.PromptConfigIDContextKey).(pgtype.UUID)

	toDate := timeutils.ParseDate(r.URL.Query().Get("toDate"), time.Now())
	fromDate := timeutils.ParseDate(r.URL.Query().Get("fromDate"), timeutils.GetFirstDayOfMonth())

	promptConfigAnalytics := repositories.GetPromptConfigAnalyticsByDateRange(
		r.Context(),
		promptConfigID,
		fromDate,
		toDate,
	)

	w.WriteHeader(http.StatusOK)
	serialization.RenderJSONResponse(w, http.StatusOK, promptConfigAnalytics)
}

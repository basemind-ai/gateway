package api

import (
	"fmt"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/dto"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/repositories"
	"github.com/basemind-ai/monorepo/shared/go/apierror"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"github.com/go-chi/chi/v5"
	"github.com/rs/zerolog/log"
	"net/http"
	"strings"
)

// HandleCreatePromptConfig - creates a prompt config for the given application.
// The first prompt config created for an application is automatically set as the default.
func HandleCreatePromptConfig(w http.ResponseWriter, r *http.Request) {
	applicationId, uuidErr := db.StringToUUID(chi.URLParam(r, "applicationId"))
	if uuidErr != nil {
		apierror.BadRequest(InvalidApplicationIdError).Render(w, r)
		return
	}

	createPromptConfigDTO := dto.PromptConfigCreateDTO{}
	if deserializationErr := serialization.DeserializeJson(r.Body, &createPromptConfigDTO); deserializationErr != nil {
		log.Error().Err(deserializationErr).Msg("failed to deserialize request body")
		apierror.BadRequest(InvalidRequestBodyError).Render(w, r)
		return
	}

	if validateErr := validate.Struct(&createPromptConfigDTO); validateErr != nil {
		log.Error().Err(validateErr).Msg("invalid request")
		apierror.BadRequest(InvalidRequestBodyError).Render(w, r)
		return
	}

	promptConfig, createErr := repositories.CreatePromptConfig(
		r.Context(),
		*applicationId,
		createPromptConfigDTO,
	)

	if createErr != nil {
		if strings.Contains(
			createErr.Error(),
			"duplicate key value violates unique constraint",
		) {
			log.Debug().Err(createErr).Msg("duplicate name")
			msg := fmt.Sprintf(
				"prompt config with the name '%s' already exists for the given application",
				createPromptConfigDTO.Name,
			)
			apierror.BadRequest(msg).Render(w, r)
			return
		}
		log.Error().Err(createErr).Msg("failed to create prompt config")

		apierror.InternalServerError().Render(w, r)
		return
	}

	serialization.RenderJsonResponse(w, http.StatusCreated, promptConfig)
}

// HandleRetrievePromptConfigs - retrieves all prompt configs for the given application.
func HandleRetrievePromptConfigs(w http.ResponseWriter, r *http.Request) {
	applicationId, uuidErr := db.StringToUUID(chi.URLParam(r, "applicationId"))
	if uuidErr != nil {
		apierror.BadRequest(InvalidApplicationIdError).Render(w, r)
		return
	}

	promptConfigs, retrivalErr := db.
		GetQueries().
		FindApplicationPromptConfigs(r.Context(), *applicationId)

	if retrivalErr != nil {
		log.Error().Err(retrivalErr).Msg("failed to retrieve prompt configs")
		apierror.InternalServerError().Render(w, r)
		return
	}

	serialization.RenderJsonResponse(w, http.StatusOK, promptConfigs)
}
func HandleUpdatePromptConfig(w http.ResponseWriter, r *http.Request) {
	promptConfigId, uuidErr := db.StringToUUID(chi.URLParam(r, "promptConfigId"))
	if uuidErr != nil {
		apierror.BadRequest(InvalidPromptConfigIdError).Render(w, r)
		return
	}

	updatePromptConfigDTO := &dto.PromptConfigUpdateDTO{}
	if deserializationErr := serialization.DeserializeJson(r.Body, updatePromptConfigDTO); deserializationErr != nil {
		log.Error().Err(deserializationErr).Msg("failed to deserialize request body")
		apierror.BadRequest(InvalidRequestBodyError).Render(w, r)
		return
	}

	if validateErr := validate.Struct(updatePromptConfigDTO); validateErr != nil {
		log.Error().Err(validateErr).Msg("invalid request")
		apierror.BadRequest(InvalidRequestBodyError).Render(w, r)
		return
	}

	updatedPromptConfig, updatePromptConfigErr := repositories.UpdatePromptConfig(
		r.Context(), *promptConfigId, *updatePromptConfigDTO,
	)

	if updatePromptConfigErr != nil {
		log.Error().Err(updatePromptConfigErr).Msg("failed to update prompt config")
		if strings.Contains(
			updatePromptConfigErr.Error(),
			"duplicate key value violates unique constraint",
		) {
			msg := fmt.Sprintf(
				"prompt config with the name '%s' already exists for the given application",
				*updatePromptConfigDTO.Name,
			)
			apierror.BadRequest(msg).Render(w, r)
			return
		}

		apierror.InternalServerError().Render(w, r)
		return
	}

	serialization.RenderJsonResponse(w, http.StatusOK, updatedPromptConfig)
}

// HandleSetApplicationDefaultPromptConfig - sets the default prompt config for the given application.
// The default prompt config is used when no prompt config is specified in a prompt request.
func HandleSetApplicationDefaultPromptConfig(w http.ResponseWriter, r *http.Request) {
	applicationId, applicationIdUuidErr := db.StringToUUID(chi.URLParam(r, "applicationId"))
	if applicationIdUuidErr != nil {
		apierror.BadRequest(InvalidApplicationIdError).Render(w, r)
		return
	}

	promptConfigId, uuidErr := db.StringToUUID(chi.URLParam(r, "promptConfigId"))
	if uuidErr != nil {
		apierror.BadRequest(InvalidPromptConfigIdError).Render(w, r)
		return
	}

	updateErr := repositories.UpdateApplicationDefaultPromptConfig(
		r.Context(),
		*applicationId,
		*promptConfigId,
	)
	if updateErr != nil {
		if strings.Contains(
			updateErr.Error(),
			"is already the default",
		) {
			log.Debug().Err(updateErr).Msg("already default")
			apierror.BadRequest(updateErr.Error()).Render(w, r)
			return
		}
		log.Error().Err(updateErr).Msg("failed to create prompt config")

		apierror.InternalServerError().Render(w, r)
		return
	}

	serialization.RenderJsonResponse(w, http.StatusOK, nil)
}

// HandleDeletePromptConfig - deletes the prompt config with the given ID.
// The default prompt config cannot be deleted.
func HandleDeletePromptConfig(w http.ResponseWriter, r *http.Request) {
	promptConfigId, uuidErr := db.StringToUUID(chi.URLParam(r, "promptConfigId"))
	if uuidErr != nil {
		apierror.BadRequest(InvalidPromptConfigIdError).Render(w, r)
		return
	}

	promptConfig, retrievePromptConfigErr := db.GetQueries().
		FindPromptConfigById(r.Context(), *promptConfigId)

	if retrievePromptConfigErr != nil {
		log.Error().Err(retrievePromptConfigErr).Msg("failed to retrieve prompt config")
		apierror.BadRequest("prompt config with the given ID does not exist").Render(w, r)
		return
	}

	if promptConfig.IsDefault {
		apierror.BadRequest("cannot delete the default prompt config").Render(w, r)
		return
	}

	if deleteErr := db.GetQueries().DeletePromptConfig(r.Context(), *promptConfigId); deleteErr != nil {
		log.Error().Err(deleteErr).Msg("failed to delete prompt config")
		apierror.InternalServerError().Render(w, r)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

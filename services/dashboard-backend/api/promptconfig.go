package api

import (
	"fmt"
	"github.com/basemind-ai/monorepo/shared/go/apierror"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"github.com/go-chi/chi/v5"
	"github.com/rs/zerolog/log"
	"net/http"
	"strings"
)

type PromptConfigDTO struct {
	Name              string         `json:"name" validate:"required"`
	ModelParameters   []byte         `json:"modelParameters" validate:"required"`
	ModelType         db.ModelType   `json:"modelType" validate:"oneof=gpt-3.5-turbo gpt-3.5-turbo-16k gpt-4 gpt-4-32k"`
	ModelVendor       db.ModelVendor `json:"modelVendor" validate:"oneof=OPEN_AI"`
	PromptMessages    []byte         `json:"promptMessages" validate:"required"`
	TemplateVariables []string       `json:"templateVariables" validate:"required"`
	IsDefault         bool           `json:"isDefault" validate:"required"`
}

func HandleCreatePromptConfig(w http.ResponseWriter, r *http.Request) {
	applicationId, uuidErr := db.StringToUUID(chi.URLParam(r, "applicationId"))
	if uuidErr != nil {
		apierror.BadRequest(InvalidApplicationIdError).Render(w, r)
		return
	}

	dto := &PromptConfigDTO{}
	if deserializationErr := serialization.DeserializeJson(r.Body, dto); deserializationErr != nil {
		log.Error().Err(deserializationErr).Msg("failed to deserialize request body")
		apierror.BadRequest(InvalidRequestBodyError).Render(w, r)
		return
	}

	if validateErr := validate.Struct(dto); validateErr != nil {
		log.Error().Err(validateErr).Msg("invalid request")
		apierror.BadRequest(InvalidRequestBodyError).Render(w, r)
		return
	}

	queries, tx, txErr := db.GetTransactionQueries(r.Context())
	if txErr != nil {
		log.Error().Err(txErr).Msg("failed to create transaction")
		apierror.InternalServerError().Render(w, r)
		return
	}

	if defaultPromptConfig, retrieveDefaultPromptConfigErr := db.GetQueries().FindDefaultPromptConfigByApplicationId(
		r.Context(),
		*applicationId,
	); retrieveDefaultPromptConfigErr == nil && dto.IsDefault {
		// we allow only a single prompt config to be default for the time being. We might revisit this in the future
		// and update the data-model accordingly.
		if updateErr := queries.UpdatePromptConfigIsDefault(r.Context(), db.UpdatePromptConfigIsDefaultParams{
			ID:        defaultPromptConfig.ID,
			IsDefault: false,
		}); updateErr != nil {
			log.Error().Err(updateErr).Msg("failed to update existing prompt config")
			apierror.InternalServerError().Render(w, r)
			return
		}
	} else if retrieveDefaultPromptConfigErr != nil {
		// if the prompt config to be created is the only prompt config for the application, it will be set to default
		// as the default case.
		dto.IsDefault = true
	}

	promptConfig, createPromptConfigErr := db.GetQueries().CreatePromptConfig(r.Context(), db.CreatePromptConfigParams{
		ApplicationID:     *applicationId,
		Name:              dto.Name,
		ModelParameters:   dto.ModelParameters,
		ModelType:         dto.ModelType,
		ModelVendor:       dto.ModelVendor,
		PromptMessages:    dto.PromptMessages,
		TemplateVariables: dto.TemplateVariables,
		IsDefault:         dto.IsDefault,
	})

	if createPromptConfigErr != nil {
		log.Error().Err(createPromptConfigErr).Msg("failed to create prompt config")
		if rollbackErr := tx.Rollback(r.Context()); rollbackErr != nil {
			log.Error().Err(rollbackErr).Msg("failed to rollback transaction")
		}

		if strings.Contains(createPromptConfigErr.Error(), "duplicate key value violates unique constraint") {
			msg := fmt.Sprintf("prompt config with the name '%s' already exists for the given application", dto.Name)
			apierror.BadRequest(msg).Render(w, r)
			return
		}

		apierror.InternalServerError().Render(w, r)
		return
	}

	if commitErr := tx.Commit(r.Context()); commitErr != nil {
		log.Error().Err(commitErr).Msg("failed to commit transaction")
		apierror.InternalServerError().Render(w, r)
		return
	}

	serialization.RenderJsonResponse(w, http.StatusCreated, promptConfig)
}

func HandleRetrievePromptConfigs(w http.ResponseWriter, r *http.Request) {
	applicationId, uuidErr := db.StringToUUID(chi.URLParam(r, "applicationId"))
	if uuidErr != nil {
		apierror.BadRequest(InvalidApplicationIdError).Render(w, r)
		return
	}

	promptConfigs, retrivalErr := db.GetQueries().RetrieveApplicationPromptConfigs(r.Context(), *applicationId)
	if retrivalErr != nil {
		log.Error().Err(retrivalErr).Msg("failed to retrieve prompt configs")
		apierror.InternalServerError().Render(w, r)
		return
	}

	serialization.RenderJsonResponse(w, http.StatusOK, promptConfigs)
}

func HandleUpdatePromptConfig(w http.ResponseWriter, r *http.Request) {
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

	dto := &PromptConfigDTO{}
	if deserializationErr := serialization.DeserializeJson(r.Body, dto); deserializationErr != nil {
		log.Error().Err(deserializationErr).Msg("failed to deserialize request body")
		apierror.BadRequest(InvalidRequestBodyError).Render(w, r)
		return
	}

	if validateErr := validate.Struct(dto); validateErr != nil {
		log.Error().Err(validateErr).Msg("invalid request")
		apierror.BadRequest(InvalidRequestBodyError).Render(w, r)
		return
	}

	defaultPromptConfig, retrieveDefaultPromptConfigErr := db.GetQueries().FindDefaultPromptConfigByApplicationId(
		r.Context(),
		*applicationId,
	)

	if retrieveDefaultPromptConfigErr != nil {
		log.Error().Err(retrieveDefaultPromptConfigErr).Msgf("application with ID %v does not have a default prompt config", applicationId)
		apierror.InternalServerError().Render(w, r)
		return
	}

	queries, tx, txErr := db.GetTransactionQueries(r.Context())
	if txErr != nil {
		log.Error().Err(txErr).Msg("failed to create transaction")
		apierror.InternalServerError().Render(w, r)
		return
	}

	if !dto.IsDefault && defaultPromptConfig.ID == *promptConfigId {
		apierror.BadRequest("cannot make the default prompt config non-default without setting another config as the default first").Render(w, r)
		return
	}

	if dto.IsDefault && defaultPromptConfig.ID != *promptConfigId {
		if updateErr := queries.UpdatePromptConfigIsDefault(r.Context(), db.UpdatePromptConfigIsDefaultParams{
			ID:        defaultPromptConfig.ID,
			IsDefault: false,
		}); updateErr != nil {
			log.Error().Err(updateErr).Msg("failed to update existing prompt config")
			apierror.InternalServerError().Render(w, r)
			return
		}
	}

	updatedPromptConfig, updatePromptConfigErr := queries.UpdatePromptConfig(r.Context(), db.UpdatePromptConfigParams{
		ID:                *promptConfigId,
		Name:              dto.Name,
		ModelParameters:   dto.ModelParameters,
		ModelType:         dto.ModelType,
		ModelVendor:       dto.ModelVendor,
		PromptMessages:    dto.PromptMessages,
		TemplateVariables: dto.TemplateVariables,
		IsDefault:         dto.IsDefault,
	})

	if updatePromptConfigErr != nil {
		log.Error().Err(updatePromptConfigErr).Msg("failed to update prompt config")
		if rollbackErr := tx.Rollback(r.Context()); rollbackErr != nil {
			log.Error().Err(rollbackErr).Msg("failed to rollback transaction")
		}

		if strings.Contains(updatePromptConfigErr.Error(), "duplicate key value violates unique constraint") {
			msg := fmt.Sprintf("prompt config with the name '%s' already exists for the given application", dto.Name)
			apierror.BadRequest(msg).Render(w, r)
			return
		}

		apierror.InternalServerError().Render(w, r)
		return
	}

	if commitErr := tx.Commit(r.Context()); commitErr != nil {
		log.Error().Err(commitErr).Msg("failed to commit transaction")
		apierror.InternalServerError().Render(w, r)
		return
	}

	serialization.RenderJsonResponse(w, http.StatusOK, updatedPromptConfig)
}

func HandleDeletePromptConfig(w http.ResponseWriter, r *http.Request) {
	promptConfigId, uuidErr := db.StringToUUID(chi.URLParam(r, "promptConfigId"))
	if uuidErr != nil {
		apierror.BadRequest(InvalidPromptConfigIdError).Render(w, r)
		return
	}

	if deleteErr := db.GetQueries().DeletePromptConfig(r.Context(), *promptConfigId); deleteErr != nil {
		log.Error().Err(deleteErr).Msg("failed to delete prompt config")
		apierror.InternalServerError().Render(w, r)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

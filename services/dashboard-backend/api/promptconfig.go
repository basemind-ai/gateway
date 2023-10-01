package api

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/basemind-ai/monorepo/shared/go/apierror"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/rs/zerolog/log"
	"net/http"
	"regexp"
	"strings"
)

var curlyBracesRegex = regexp.MustCompile(`\{([^}]+)\}`)

type PromptConfigCreateDTO struct {
	Name                   string          `json:"name" validate:"required"`
	ModelParameters        []byte          `json:"modelParameters" validate:"required"`
	ModelType              db.ModelType    `json:"modelType" validate:"oneof=gpt-3.5-turbo gpt-3.5-turbo-16k gpt-4 gpt-4-32k"`
	ModelVendor            db.ModelVendor  `json:"modelVendor" validate:"oneof=OPEN_AI"`
	ProviderPromptMessages json.RawMessage `json:"promptMessages" validate:"required"`
}

type PromptConfigUpdateDTO struct {
	Name            *string       `json:"name,omitempty"`
	ModelParameters *[]byte       `json:"modelParameters,omitempty"`
	ModelType       *db.ModelType `json:"modelType,omitempty" validate:"omitempty,oneof=gpt-3.5-turbo gpt-3.5-turbo-16k gpt-4 gpt-4-32k"`
	IsDefault       *bool         `json:"isDefault,omitempty"`
}

func HandleCreatePromptConfig(w http.ResponseWriter, r *http.Request) {
	applicationId, uuidErr := db.StringToUUID(chi.URLParam(r, "applicationId"))
	if uuidErr != nil {
		apierror.BadRequest(InvalidApplicationIdError).Render(w, r)
		return
	}

	dto := &PromptConfigCreateDTO{}
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

	expectedTemplateVariables, parsePromptMessagesErr := ParsePromptMessages(dto.ProviderPromptMessages, dto.ModelVendor)
	if parsePromptMessagesErr != nil {
		log.Error().Err(parsePromptMessagesErr).Msg("failed to parse prompt messages")
		apierror.InternalServerError().Render(w, r)
		return
	}

	_, retrieveDefaultPromptConfigErr := db.GetQueries().FindDefaultPromptConfigByApplicationId(
		r.Context(),
		*applicationId,
	)
	// we automatically set the first created prompt config as the default.
	// we know this is the first prompt config for the application, because there must always be a default config.
	setDefault := retrieveDefaultPromptConfigErr != nil

	promptConfig, createPromptConfigErr := db.GetQueries().CreatePromptConfig(r.Context(), db.CreatePromptConfigParams{
		ApplicationID:             *applicationId,
		Name:                      strings.TrimSpace(dto.Name),
		ModelParameters:           dto.ModelParameters,
		ModelType:                 dto.ModelType,
		ModelVendor:               dto.ModelVendor,
		ProviderPromptMessages:    dto.ProviderPromptMessages,
		ExpectedTemplateVariables: expectedTemplateVariables,
		IsDefault:                 setDefault,
	})

	if createPromptConfigErr != nil {
		log.Error().Err(createPromptConfigErr).Msg("failed to create prompt config")

		if strings.Contains(createPromptConfigErr.Error(), "duplicate key value violates unique constraint") {
			msg := fmt.Sprintf("prompt config with the name '%s' already exists for the given application", dto.Name)
			apierror.BadRequest(msg).Render(w, r)
			return
		}

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

func updateDefaultPromptConfig(ctx context.Context, queries *db.Queries, updatedDefaultValue bool, applicationId *pgtype.UUID, promptConfigId *pgtype.UUID) *apierror.ApiError {
	defaultPromptConfig, retrieveDefaultPromptConfigErr := queries.FindDefaultPromptConfigByApplicationId(
		ctx,
		*applicationId,
	)
	if retrieveDefaultPromptConfigErr != nil {
		log.Error().Err(retrieveDefaultPromptConfigErr).Msg("failed to retrieve the default prompt config")
		return apierror.InternalServerError("failed to retrieve default prompt config")
	}

	if defaultPromptConfig.ID == *promptConfigId && !updatedDefaultValue {
		return apierror.BadRequest("cannot make the default prompt config non-default without setting another config as the default first")
	}

	if defaultPromptConfig.ID != *promptConfigId && updatedDefaultValue {
		if updateErr := queries.UpdatePromptConfigIsDefault(ctx, db.UpdatePromptConfigIsDefaultParams{
			ID:        defaultPromptConfig.ID,
			IsDefault: false,
		}); updateErr != nil {
			log.Error().Err(updateErr).Msg("failed to update default prompt config")
			return apierror.InternalServerError("failed to update default prompt config")
		}
	}

	return nil
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

	dto := &PromptConfigUpdateDTO{}
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

	if dto.IsDefault != nil {
		if updateErr := updateDefaultPromptConfig(r.Context(), queries, *dto.IsDefault, applicationId, promptConfigId); updateErr != nil {
			updateErr.Render(w, r)
			return
		}
	}

	retrievedPromptConfig, retrievePromptConfigErr := queries.FindPromptConfigById(r.Context(), *promptConfigId)
	if retrievePromptConfigErr != nil {
		log.Error().Err(retrievePromptConfigErr).Msg("failed to retrieve prompt config")
		apierror.BadRequest("prompt config with the given ID does not exist").Render(w, r)
		return
	}

	updateParams := db.UpdatePromptConfigParams{
		ID:              *promptConfigId,
		Name:            retrievedPromptConfig.Name,
		ModelParameters: retrievedPromptConfig.ModelParameters,
		ModelType:       retrievedPromptConfig.ModelType,
		IsDefault:       retrievedPromptConfig.IsDefault,
	}

	if dto.Name != nil && len(strings.TrimSpace(*dto.Name)) > 0 {
		updateParams.Name = strings.TrimSpace(*dto.Name)
	}
	if dto.ModelParameters != nil {
		updateParams.ModelParameters = *dto.ModelParameters
	}
	if dto.ModelType != nil {
		updateParams.ModelType = *dto.ModelType
	}
	if dto.IsDefault != nil {
		updateParams.IsDefault = *dto.IsDefault
	}

	updatedPromptConfig, updatePromptConfigErr := queries.UpdatePromptConfig(r.Context(), updateParams)

	if updatePromptConfigErr != nil {
		log.Error().Err(updatePromptConfigErr).Msg("failed to update prompt config")
		if rollbackErr := tx.Rollback(r.Context()); rollbackErr != nil {
			log.Error().Err(rollbackErr).Msg("failed to rollback transaction")
		}

		if strings.Contains(updatePromptConfigErr.Error(), "duplicate key value violates unique constraint") {
			msg := fmt.Sprintf("prompt config with the name '%s' already exists for the given application", *dto.Name)
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

	promptConfig, retrievePromptConfigErr := db.GetQueries().FindPromptConfigById(r.Context(), *promptConfigId)
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

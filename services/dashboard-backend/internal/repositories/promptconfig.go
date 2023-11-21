package repositories

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/basemind-ai/monorepo/shared/go/db/models"
	"github.com/basemind-ai/monorepo/shared/go/exc"
	"github.com/basemind-ai/monorepo/shared/go/ptr"
	"strings"
	"time"

	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/dto"
	"github.com/basemind-ai/monorepo/shared/go/datatypes"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/rediscache"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/rs/zerolog/log"
)

func CreatePromptConfig(
	ctx context.Context,
	applicationID pgtype.UUID,
	createPromptConfigDTO dto.PromptConfigCreateDTO,
) (*datatypes.PromptConfigDTO, error) {
	expectedTemplateVariables, promptMessages, parsePromptMessagesErr := ParsePromptMessages(
		createPromptConfigDTO.ProviderPromptMessages,
		createPromptConfigDTO.ModelVendor,
	)
	if parsePromptMessagesErr != nil {
		log.Error().Err(parsePromptMessagesErr).Msg("failed to parse prompt messages")
		return nil, fmt.Errorf("failed to parse prompt messages - %w", parsePromptMessagesErr)
	}

	defaultExists := exc.MustResult(db.
		GetQueries().
		CheckDefaultPromptConfigExists(ctx, applicationID))

	// we automatically set the first created prompt config as the default.
	// we know this is the first prompt config for the application, because there must always be a default config.
	promptConfig, createErr := db.
		GetQueries().
		CreatePromptConfig(ctx, models.CreatePromptConfigParams{
			ApplicationID:             applicationID,
			Name:                      strings.TrimSpace(createPromptConfigDTO.Name),
			ModelParameters:           ptr.Deref(createPromptConfigDTO.ModelParameters, nil),
			ModelType:                 createPromptConfigDTO.ModelType,
			ModelVendor:               createPromptConfigDTO.ModelVendor,
			ProviderPromptMessages:    ptr.Deref(promptMessages, nil),
			ExpectedTemplateVariables: expectedTemplateVariables,
			IsDefault:                 !createPromptConfigDTO.IsTest && !defaultExists,
			IsTestConfig:              createPromptConfigDTO.IsTest,
		})

	if createErr != nil {
		log.Error().Err(createErr).Msg("failed to create prompt config")
		return nil, fmt.Errorf("failed to create prompt config - %w", createErr)
	}

	return &datatypes.PromptConfigDTO{
		ID:                        db.UUIDToString(&promptConfig.ID),
		Name:                      promptConfig.Name,
		ModelParameters:           ptr.To(json.RawMessage(promptConfig.ModelParameters)),
		ModelType:                 promptConfig.ModelType,
		ModelVendor:               promptConfig.ModelVendor,
		ProviderPromptMessages:    ptr.To(json.RawMessage(promptConfig.ProviderPromptMessages)),
		ExpectedTemplateVariables: promptConfig.ExpectedTemplateVariables,
		IsDefault:                 promptConfig.IsDefault,
		CreatedAt:                 promptConfig.CreatedAt.Time,
		UpdatedAt:                 promptConfig.UpdatedAt.Time,
	}, nil
}

func UpdateApplicationDefaultPromptConfig(
	ctx context.Context,
	applicationID pgtype.UUID,
	promptConfigID pgtype.UUID,
) error {
	defaultPromptConfig, retrieveDefaultPromptConfigErr := db.GetQueries().
		RetrieveDefaultPromptConfig(
			ctx,
			applicationID,
		)

	if retrieveDefaultPromptConfigErr != nil {
		return fmt.Errorf(
			"failed to retrieve default prompt config - %w",
			retrieveDefaultPromptConfigErr,
		)
	}

	if defaultPromptConfig.ID == promptConfigID {
		return fmt.Errorf("prompt config with id %v is already the default", promptConfigID)
	}

	tx := exc.MustResult(db.GetTransaction(ctx))
	defer db.HandleRollback(ctx, tx)

	queries := db.GetQueries().WithTx(tx)

	exc.Must(queries.UpdateDefaultPromptConfig(ctx, models.UpdateDefaultPromptConfigParams{
		ID:        defaultPromptConfig.ID,
		IsDefault: false,
	}))

	exc.Must(queries.UpdateDefaultPromptConfig(ctx, models.UpdateDefaultPromptConfigParams{
		ID:        promptConfigID,
		IsDefault: true,
	}))

	exc.LogIfErr(tx.Commit(ctx))

	go func() {
		cacheKeys := []string{
			fmt.Sprintf(
				"%s:%s",
				db.UUIDToString(&applicationID),
				db.UUIDToString(&defaultPromptConfig.ID),
			),
			fmt.Sprintf("%s:%s", db.UUIDToString(&applicationID), db.UUIDToString(&promptConfigID)),
			db.UUIDToString(&applicationID),
		}

		rediscache.Invalidate(ctx, cacheKeys...)
	}()

	return nil
}

func UpdatePromptConfig(
	ctx context.Context,
	promptConfigID pgtype.UUID,
	updatePromptConfigDTO dto.PromptConfigUpdateDTO,
) (*datatypes.PromptConfigDTO, error) {
	existingPromptConfig, retrievePromptConfigErr := db.GetQueries().RetrievePromptConfig(
		ctx,
		promptConfigID,
	)
	if retrievePromptConfigErr != nil {
		log.Error().Err(retrievePromptConfigErr).Msg("failed to retrieve prompt config")
		return nil, fmt.Errorf("failed to retrieve prompt config - %w", retrievePromptConfigErr)
	}

	updateParams := models.UpdatePromptConfigParams{
		ID:                        promptConfigID,
		Name:                      existingPromptConfig.Name,
		ModelParameters:           existingPromptConfig.ModelParameters,
		ModelType:                 existingPromptConfig.ModelType,
		ModelVendor:               existingPromptConfig.ModelVendor,
		ProviderPromptMessages:    existingPromptConfig.ProviderPromptMessages,
		ExpectedTemplateVariables: existingPromptConfig.ExpectedTemplateVariables,
	}

	if updatePromptConfigDTO.Name != nil {
		updateParams.Name = strings.TrimSpace(*updatePromptConfigDTO.Name)
	}
	// TODO: enable this when we add more vendors
	// if updatePromptConfigDTO.ModelVendor != nil {
	//	updateParams.ModelVendor = *updatePromptConfigDTO.ModelVendor
	//}
	if updatePromptConfigDTO.ModelType != nil {
		updateParams.ModelType = *updatePromptConfigDTO.ModelType
	}
	if updatePromptConfigDTO.ModelParameters != nil {
		updateParams.ModelParameters = *updatePromptConfigDTO.ModelParameters
	}
	if updatePromptConfigDTO.ProviderPromptMessages != nil {
		expectedTemplateVariables, providerMessages, parsePromptMessagesErr := ParsePromptMessages(
			updatePromptConfigDTO.ProviderPromptMessages,
			updateParams.ModelVendor,
		)
		if parsePromptMessagesErr != nil {
			return nil, fmt.Errorf("failed to parse prompt messages - %w", parsePromptMessagesErr)
		}

		updateParams.ProviderPromptMessages = *providerMessages
		updateParams.ExpectedTemplateVariables = expectedTemplateVariables
	}

	updatedPromptConfig, updateErr := db.GetQueries().UpdatePromptConfig(ctx, updateParams)
	if updateErr != nil {
		log.Error().Err(updateErr).Msg("failed to update prompt config")
		return nil, fmt.Errorf("failed to update prompt config - %w", updateErr)
	}

	go func() {
		cacheKeys := []string{
			fmt.Sprintf(
				"%s:%s",
				db.UUIDToString(&updatedPromptConfig.ApplicationID),
				db.UUIDToString(&promptConfigID),
			),
		}

		if updatedPromptConfig.IsDefault {
			cacheKeys = append(cacheKeys, db.UUIDToString(&updatedPromptConfig.ApplicationID))
		}

		rediscache.Invalidate(ctx, cacheKeys...)
	}()

	return &datatypes.PromptConfigDTO{
		ID:              db.UUIDToString(&updatedPromptConfig.ID),
		Name:            updatedPromptConfig.Name,
		ModelParameters: ptr.To(json.RawMessage(updatedPromptConfig.ModelParameters)),
		ModelType:       updatedPromptConfig.ModelType,
		ModelVendor:     updatedPromptConfig.ModelVendor,
		ProviderPromptMessages: ptr.To(
			json.RawMessage(updatedPromptConfig.ProviderPromptMessages),
		),
		ExpectedTemplateVariables: updatedPromptConfig.ExpectedTemplateVariables,
		IsDefault:                 updatedPromptConfig.IsDefault,
		CreatedAt:                 updatedPromptConfig.CreatedAt.Time,
		UpdatedAt:                 updatedPromptConfig.UpdatedAt.Time,
	}, nil
}

func DeletePromptConfig(ctx context.Context,
	applicationID pgtype.UUID,
	promptConfigID pgtype.UUID,
) {
	tx := exc.MustResult(db.GetOrCreateTx(ctx))

	if db.ShouldCommit(ctx) {
		defer db.HandleRollback(ctx, tx)
	}

	queries := db.GetQueries().WithTx(tx)

	exc.Must(queries.DeletePromptConfig(ctx, promptConfigID))

	db.CommitIfShouldCommit(ctx, tx)

	go func() {
		rediscache.Invalidate(
			ctx,
			fmt.Sprintf("%s:%s", db.UUIDToString(&applicationID), db.UUIDToString(&promptConfigID)),
		)
	}()
}

func GetPromptConfigAPIRequestCountByDateRange(
	ctx context.Context,
	promptConfigID pgtype.UUID,
	fromDate, toDate time.Time,
) int64 {
	return exc.MustResult(db.GetQueries().
		RetrievePromptConfigAPIRequestCount(ctx, models.RetrievePromptConfigAPIRequestCountParams{
			ID:          promptConfigID,
			CreatedAt:   pgtype.Timestamptz{Time: fromDate, Valid: true},
			CreatedAt_2: pgtype.Timestamptz{Time: toDate, Valid: true},
		}))
}

func GetPromptConfigAnalyticsByDateRange(
	ctx context.Context,
	promptConfigID pgtype.UUID,
	fromDate, toDate time.Time,
) dto.AnalyticsDTO {
	totalRequests := GetPromptConfigAPIRequestCountByDateRange(
		ctx,
		promptConfigID,
		fromDate,
		toDate,
	)

	tokensCost := exc.MustResult(
		db.NumericToDecimal(exc.MustResult(db.GetQueries().RetrievePromptConfigTokensTotalCost(
			ctx,
			models.RetrievePromptConfigTokensTotalCostParams{
				ID:          promptConfigID,
				CreatedAt:   pgtype.Timestamptz{Time: fromDate, Valid: true},
				CreatedAt_2: pgtype.Timestamptz{Time: toDate, Valid: true},
			},
		))),
	)

	return dto.AnalyticsDTO{
		TotalAPICalls: totalRequests,
		TokenCost:     *tokensCost,
	}
}

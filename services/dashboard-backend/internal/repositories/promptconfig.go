package repositories

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/dto"
	"github.com/basemind-ai/monorepo/shared/go/datatypes"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/rediscache"
	"github.com/basemind-ai/monorepo/shared/go/tokenutils"
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

	defaultExists, retrievalErr := db.
		GetQueries().
		CheckDefaultPromptConfigExists(ctx, applicationID)

	if retrievalErr != nil {
		log.Error().Err(retrievalErr).Msg("failed to retrieve default prompt config")
		return nil, fmt.Errorf("failed to retrieve default prompt config - %w", retrievalErr)
	}

	// we automatically set the first created prompt config as the default.
	// we know this is the first prompt config for the application, because there must always be a default config.
	promptConfig, createErr := db.
		GetQueries().
		CreatePromptConfig(ctx, db.CreatePromptConfigParams{
			ApplicationID:             applicationID,
			Name:                      strings.TrimSpace(createPromptConfigDTO.Name),
			ModelParameters:           createPromptConfigDTO.ModelParameters,
			ModelType:                 createPromptConfigDTO.ModelType,
			ModelVendor:               createPromptConfigDTO.ModelVendor,
			ProviderPromptMessages:    promptMessages,
			ExpectedTemplateVariables: expectedTemplateVariables,
			IsDefault:                 !defaultExists,
		})

	if createErr != nil {
		log.Error().Err(createErr).Msg("failed to create prompt config")
		return nil, fmt.Errorf("failed to create prompt config - %w", createErr)
	}

	return &datatypes.PromptConfigDTO{
		ID:                        db.UUIDToString(&promptConfig.ID),
		Name:                      promptConfig.Name,
		ModelParameters:           promptConfig.ModelParameters,
		ModelType:                 promptConfig.ModelType,
		ModelVendor:               promptConfig.ModelVendor,
		ProviderPromptMessages:    promptConfig.ProviderPromptMessages,
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

	tx, txErr := db.GetTransaction(ctx)
	if txErr != nil {
		return fmt.Errorf("failed to create transaction - %w", txErr)
	}
	defer func() {
		if rollbackErr := tx.Rollback(ctx); rollbackErr != nil {
			log.Error().Err(rollbackErr).Msg("failed to rollback transaction")
		}
	}()

	queries := db.GetQueries().WithTx(tx)

	if updateErr := queries.UpdateDefaultPromptConfig(ctx, db.UpdateDefaultPromptConfigParams{
		ID:        defaultPromptConfig.ID,
		IsDefault: false,
	}); updateErr != nil {
		return fmt.Errorf(
			"failed to set the existing default config as non-default - %w",
			updateErr,
		)
	}

	if updateErr := queries.UpdateDefaultPromptConfig(ctx, db.UpdateDefaultPromptConfigParams{
		ID:        promptConfigID,
		IsDefault: true,
	}); updateErr != nil {
		return fmt.Errorf("failed to set the new prompt config as default - %w", updateErr)
	}

	if commitErr := tx.Commit(ctx); commitErr != nil {
		return fmt.Errorf("failed to commit transaction - %w", commitErr)
	}

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

	updateParams := db.UpdatePromptConfigParams{
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
	if updatePromptConfigDTO.ModelVendor != nil {
		updateParams.ModelVendor = *updatePromptConfigDTO.ModelVendor
	}
	if updatePromptConfigDTO.ModelType != nil {
		updateParams.ModelType = *updatePromptConfigDTO.ModelType
	}
	if updatePromptConfigDTO.ModelParameters != nil {
		updateParams.ModelParameters = *updatePromptConfigDTO.ModelParameters
	}
	if updatePromptConfigDTO.ProviderPromptMessages != nil {
		expectedTemplateVariables, providerMessages, parsePromptMessagesErr := ParsePromptMessages(
			*updatePromptConfigDTO.ProviderPromptMessages,
			updateParams.ModelVendor,
		)
		if parsePromptMessagesErr != nil {
			return nil, fmt.Errorf("failed to parse prompt messages - %w", parsePromptMessagesErr)
		}

		updateParams.ProviderPromptMessages = providerMessages
		updateParams.ExpectedTemplateVariables = expectedTemplateVariables
	}

	updatedPromptConfig, updateErr := db.GetQueries().UpdatePromptConfig(ctx, updateParams)
	if updateErr != nil {
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
		ID:                        db.UUIDToString(&updatedPromptConfig.ID),
		Name:                      updatedPromptConfig.Name,
		ModelParameters:           updatedPromptConfig.ModelParameters,
		ModelType:                 updatedPromptConfig.ModelType,
		ModelVendor:               updatedPromptConfig.ModelVendor,
		ProviderPromptMessages:    updatedPromptConfig.ProviderPromptMessages,
		ExpectedTemplateVariables: updatedPromptConfig.ExpectedTemplateVariables,
		IsDefault:                 updatedPromptConfig.IsDefault,
		CreatedAt:                 updatedPromptConfig.CreatedAt.Time,
		UpdatedAt:                 updatedPromptConfig.UpdatedAt.Time,
	}, nil
}

func DeletePromptConfig(ctx context.Context,
	applicationID pgtype.UUID,
	promptConfigID pgtype.UUID,
) error {
	tx, err := db.GetOrCreateTx(ctx)
	if err != nil {
		log.Error().Err(err).Msg("failed to create transaction")
		return fmt.Errorf("failed to get transaction: %w", err)
	}
	if db.ShouldCommit(ctx) {
		defer func() {
			if rollbackErr := tx.Rollback(ctx); rollbackErr != nil {
				log.Error().Err(rollbackErr).Msg("failed to rollback transaction")
			}
		}()
	}

	queries := db.GetQueries().WithTx(tx)

	if deleteErr := queries.DeletePromptConfig(ctx, promptConfigID); deleteErr != nil {
		log.Error().Err(deleteErr).Msg("failed to delete prompt config")
		return fmt.Errorf("failed to delete prompt config: %w", deleteErr)
	}

	if db.ShouldCommit(ctx) {
		if commitErr := tx.Commit(ctx); commitErr != nil {
			return fmt.Errorf("failed to commit transaction: %w", commitErr)
		}
	}

	go func() {
		rediscache.Invalidate(
			ctx,
			fmt.Sprintf("%s:%s", db.UUIDToString(&applicationID), db.UUIDToString(&promptConfigID)),
		)
	}()

	return nil
}

func GetTotalPromptRequestCountByDateRange(
	ctx context.Context,
	promptConfigID pgtype.UUID,
	fromDate, toDate time.Time,
) (int64, error) {
	totalRequests, dbErr := db.GetQueries().
		RetrievePromptConfigAPIRequestCount(ctx, db.RetrievePromptConfigAPIRequestCountParams{
			ID:          promptConfigID,
			CreatedAt:   pgtype.Timestamptz{Time: fromDate, Valid: true},
			CreatedAt_2: pgtype.Timestamptz{Time: toDate, Valid: true},
		})
	if dbErr != nil {
		return -1, fmt.Errorf("failed to retrieve total prompt requests: %w", dbErr)
	}

	return totalRequests, nil
}

func GetTotalTokensConsumedByDateRange(
	ctx context.Context,
	promptConfigID pgtype.UUID,
	fromDate, toDate time.Time,
) (map[db.ModelType]int64, error) {
	promptRequests, dbErr := db.GetQueries().RetrievePromptConfigTokensCount(
		ctx,
		db.RetrievePromptConfigTokensCountParams{
			ID:          promptConfigID,
			CreatedAt:   pgtype.Timestamptz{Time: fromDate, Valid: true},
			CreatedAt_2: pgtype.Timestamptz{Time: toDate, Valid: true},
		},
	)
	if dbErr != nil {
		return nil, fmt.Errorf("failed to retrieve total tokens consumed: %w", dbErr)
	}

	tokenCntMap := make(map[db.ModelType]int64)
	for _, record := range promptRequests {
		tokenCntMap[record.ModelType] += record.TotalTokens
	}

	return tokenCntMap, nil
}

func GetPromptConfigAnalyticsByDateRange(
	ctx context.Context,
	promptConfigID pgtype.UUID,
	fromDate, toDate time.Time,
) (dto.PromptConfigAnalyticsDTO, error) {
	totalRequests, dbErr := GetTotalPromptRequestCountByDateRange(
		ctx,
		promptConfigID,
		fromDate,
		toDate,
	)
	if dbErr != nil {
		return dto.PromptConfigAnalyticsDTO{}, dbErr
	}

	tokenCntMap, dbErr := GetTotalTokensConsumedByDateRange(ctx, promptConfigID, fromDate, toDate)
	if dbErr != nil {
		return dto.PromptConfigAnalyticsDTO{}, dbErr
	}

	var modelCost float64
	for model, tokenCnt := range tokenCntMap {
		modelCost += tokenutils.GetCostByModelType(tokenCnt, model)
	}

	return dto.PromptConfigAnalyticsDTO{
		TotalPromptRequests: totalRequests,
		ModelsCost:          modelCost,
	}, nil
}

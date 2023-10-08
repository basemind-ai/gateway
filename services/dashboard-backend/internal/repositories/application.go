package repositories

import (
	"context"
	"fmt"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/rs/zerolog/log"
)

// DeleteApplication deletes an application and all of its prompt configs by setting their deleted_at values.
func DeleteApplication(ctx context.Context, applicationID pgtype.UUID) error {
	promptConfigs, retrievalErr := db.GetQueries().
		RetrievePromptConfigs(ctx, applicationID)
	if retrievalErr != nil {
		return fmt.Errorf("failed to retrieve prompt configs: %w", retrievalErr)
	}

	tx, err := db.GetOrCreateTx(ctx)
	if err != nil {
		log.Error().Err(err).Msg("failed to create transaction")
		return fmt.Errorf("failed to get transaction: %w", err)
	}
	queries := db.GetQueries().WithTx(tx)

	for _, promptConfig := range promptConfigs {
		if deleteErr := queries.DeletePromptConfig(ctx, promptConfig.ID); deleteErr != nil {
			return fmt.Errorf("failed to delete prompt config: %w", deleteErr)
		}
	}

	if deleteErr := queries.DeleteApplication(ctx, applicationID); deleteErr != nil {
		return fmt.Errorf("failed to delete application: %w", deleteErr)
	}

	if db.ShouldCommit(ctx) {
		if commitErr := tx.Commit(ctx); commitErr != nil {
			return fmt.Errorf("failed to commit transaction: %w", commitErr)
		}
	}

	return nil
}

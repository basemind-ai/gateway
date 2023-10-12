package repositories

import (
	"context"
	"fmt"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/rediscache"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/rs/zerolog/log"
)

// DeleteApplication deletes an application and all of its prompt configs by setting their deleted_at values.
func DeleteApplication(ctx context.Context, applicationID pgtype.UUID) error {
	promptConfigs, retrievalErr := db.
		GetQueries().
		RetrievePromptConfigs(ctx, applicationID)

	if retrievalErr != nil {
		return fmt.Errorf("failed to retrieve prompt configs: %w", retrievalErr)
	}

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

	// we pass in the transaction into the nested function call via context
	transactionCtx := db.CreateTransactionContext(ctx, tx)
	// we are ensuring the nested operations should not commit the transaction
	shouldCommitCtx := db.CreateShouldCommitContext(transactionCtx, false)

	for _, promptConfig := range promptConfigs {
		if deleteErr := queries.DeletePromptConfig(shouldCommitCtx, promptConfig.ID); deleteErr != nil {
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

	go func() {
		rediscache.Invalidate(ctx, db.UUIDToString(&applicationID))
	}()

	return nil
}

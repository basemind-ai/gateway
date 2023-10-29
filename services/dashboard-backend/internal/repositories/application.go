package repositories

import (
	"context"
	"fmt"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/dto"
	"github.com/basemind-ai/monorepo/shared/go/exc"
	"github.com/basemind-ai/monorepo/shared/go/tokenutils"
	"time"

	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/rediscache"
	"github.com/jackc/pgx/v5/pgtype"
)

// DeleteApplication deletes an application and all of its prompt configs by setting their deleted_at values.
func DeleteApplication(ctx context.Context, applicationID pgtype.UUID) error {
	promptConfigs := exc.MustResult(db.
		GetQueries().
		RetrievePromptConfigs(ctx, applicationID))

	tx := exc.MustResult(db.GetOrCreateTx(ctx))

	if db.ShouldCommit(ctx) {
		defer func() {
			exc.LogIfErr(tx.Rollback(ctx), "failed to rollback transaction")
		}()
	}

	queries := db.GetQueries().WithTx(tx)

	// we pass in the transaction into the nested function call via context
	transactionCtx := db.CreateTransactionContext(ctx, tx)
	// we are ensuring the nested operations should not commit the transaction
	shouldCommitCtx := db.CreateShouldCommitContext(transactionCtx, false)

	for _, promptConfig := range promptConfigs {
		if deleteErr := DeletePromptConfig(shouldCommitCtx, applicationID, promptConfig.ID); deleteErr != nil {
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

func GetApplicationAnalyticsByDateRange(
	ctx context.Context,
	applicationID pgtype.UUID,
	fromDate, toDate time.Time,
) dto.ApplicationAnalyticsDTO {
	totalRequests := GetApplicationAPIRequestCountByDateRange(ctx, applicationID, fromDate, toDate)

	tokenCntMap := GetApplicationTokensCountPerModelTypeByDateRange(
		ctx,
		applicationID,
		fromDate,
		toDate,
	)

	var totalCost float64
	for model, tokenCnt := range tokenCntMap {
		totalCost += tokenutils.GetCostByModelType(tokenCnt, model)
	}

	return dto.ApplicationAnalyticsDTO{
		TotalRequests: totalRequests,
		ProjectedCost: totalCost,
	}
}

func GetApplicationAPIRequestCountByDateRange(
	ctx context.Context,
	applicationID pgtype.UUID,
	fromDate, toDate time.Time,
) int64 {
	return exc.MustResult(db.GetQueries().RetrieveApplicationAPIRequestCount(
		ctx,
		db.RetrieveApplicationAPIRequestCountParams{
			ID:          applicationID,
			CreatedAt:   pgtype.Timestamptz{Time: fromDate, Valid: true},
			CreatedAt_2: pgtype.Timestamptz{Time: toDate, Valid: true},
		},
	))
}

func GetApplicationTokensCountPerModelTypeByDateRange(
	ctx context.Context,
	applicationID pgtype.UUID,
	fromDate, toDate time.Time,
) map[db.ModelType]int64 {
	recordPerPromptConfig := exc.MustResult(db.GetQueries().RetrieveApplicationTokensCount(
		ctx,
		db.RetrieveApplicationTokensCountParams{
			ID:          applicationID,
			CreatedAt:   pgtype.Timestamptz{Time: fromDate, Valid: true},
			CreatedAt_2: pgtype.Timestamptz{Time: toDate, Valid: true},
		},
	))

	tokenCntMap := make(map[db.ModelType]int64)
	for _, record := range recordPerPromptConfig {
		tokenCntMap[record.ModelType] += record.TotalTokens
	}

	return tokenCntMap
}

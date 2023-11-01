package repositories

import (
	"context"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/dto"
	"github.com/basemind-ai/monorepo/shared/go/db/models"
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
		defer db.HandleRollback(ctx, tx)
	}

	queries := db.GetQueries().WithTx(tx)

	// we pass in the transaction into the nested function call via context
	transactionCtx := db.CreateTransactionContext(ctx, tx)
	// we are ensuring the nested operations should not commit the transaction
	shouldCommitCtx := db.CreateShouldCommitContext(transactionCtx, false)

	for _, promptConfig := range promptConfigs {
		DeletePromptConfig(shouldCommitCtx, applicationID, promptConfig.ID)
	}

	exc.Must(queries.DeleteApplication(ctx, applicationID))

	db.CommitIfShouldCommit(ctx, tx)

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
		models.RetrieveApplicationAPIRequestCountParams{
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
) map[models.ModelType]int64 {
	recordPerPromptConfig := exc.MustResult(db.GetQueries().RetrieveApplicationTokensCount(
		ctx,
		models.RetrieveApplicationTokensCountParams{
			ID:          applicationID,
			CreatedAt:   pgtype.Timestamptz{Time: fromDate, Valid: true},
			CreatedAt_2: pgtype.Timestamptz{Time: toDate, Valid: true},
		},
	))

	tokenCntMap := make(map[models.ModelType]int64)
	for _, record := range recordPerPromptConfig {
		tokenCntMap[record.ModelType] += record.TotalTokens
	}

	return tokenCntMap
}

package repositories

import (
	"context"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/dto"
	"github.com/basemind-ai/monorepo/shared/go/db/models"
	"github.com/basemind-ai/monorepo/shared/go/exc"
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
) dto.AnalyticsDTO {
	totalRequests := GetApplicationAPIRequestCountByDateRange(ctx, applicationID, fromDate, toDate)

	tokensCost := exc.MustResult(
		db.NumericToDecimal(exc.MustResult(db.GetQueries().RetrieveApplicationTokensTotalCost(
			ctx,
			models.RetrieveApplicationTokensTotalCostParams{
				ID:          applicationID,
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

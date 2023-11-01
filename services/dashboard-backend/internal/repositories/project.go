package repositories

import (
	"context"
	"github.com/basemind-ai/monorepo/shared/go/db/models"
	"github.com/basemind-ai/monorepo/shared/go/exc"
	"time"

	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/dto"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/tokenutils"
	"github.com/jackc/pgx/v5/pgtype"
)

func CreateProject(
	ctx context.Context,
	userAccount *models.UserAccount,
	name string,
	description string,
) (*dto.ProjectDTO, error) {
	tx := exc.MustResult(db.GetOrCreateTx(ctx))

	queries := db.GetQueries().WithTx(tx)

	project := exc.MustResult(queries.CreateProject(ctx, models.CreateProjectParams{
		Name:        name,
		Description: description,
	}))

	userProject := exc.MustResult(queries.CreateUserProject(ctx, models.CreateUserProjectParams{
		UserID:     userAccount.ID,
		ProjectID:  project.ID,
		Permission: models.AccessPermissionTypeADMIN,
	}))

	db.CommitIfShouldCommit(ctx, tx)

	projectID := db.UUIDToString(&project.ID)

	data := &dto.ProjectDTO{
		ID:           projectID,
		Name:         project.Name,
		Description:  project.Description,
		CreatedAt:    project.CreatedAt.Time,
		UpdatedAt:    project.UpdatedAt.Time,
		Permission:   string(userProject.Permission),
		Applications: nil,
	}

	return data, nil
}

func DeleteProject(ctx context.Context, projectID pgtype.UUID) error {
	applications := exc.MustResult(db.GetQueries().
		RetrieveApplications(ctx, projectID))

	tx := exc.MustResult(db.GetTransaction(ctx))

	defer db.HandleRollback(ctx, tx)

	// we pass in the transaction into the nested function call via context
	transactionCtx := db.CreateTransactionContext(ctx, tx)
	// we are ensuring the nested operations should not commit the transaction
	shouldCommitCtx := db.CreateShouldCommitContext(transactionCtx, false)

	for _, application := range applications {
		exc.Must(DeleteApplication(shouldCommitCtx, application.ID))
	}

	exc.Must(db.GetQueries().WithTx(tx).DeleteProject(ctx, projectID))

	db.CommitIfShouldCommit(ctx, tx)

	return nil
}

func GetProjectAPIRequestByDateRange(
	ctx context.Context,
	projectID pgtype.UUID,
	fromDate, toDate time.Time,
) int64 {
	totalAPICalls := exc.MustResult(db.GetQueries().
		RetrieveProjectAPIRequestCount(ctx, models.RetrieveProjectAPIRequestCountParams{
			ID:          projectID,
			CreatedAt:   pgtype.Timestamptz{Time: fromDate, Valid: true},
			CreatedAt_2: pgtype.Timestamptz{Time: toDate, Valid: true},
		}))

	return totalAPICalls
}

func GetProjectTokenCountByProjectByDateRange(
	ctx context.Context,
	projectID pgtype.UUID,
	fromDate, toDate time.Time,
) map[models.ModelType]int64 {
	tokensConsumed := exc.MustResult(db.GetQueries().
		RetrieveProjectTokensCount(ctx, models.RetrieveProjectTokensCountParams{
			ID:          projectID,
			CreatedAt:   pgtype.Timestamptz{Time: fromDate, Valid: true},
			CreatedAt_2: pgtype.Timestamptz{Time: toDate, Valid: true},
		}))

	projectTokenCntMap := make(map[models.ModelType]int64)
	for _, record := range tokensConsumed {
		projectTokenCntMap[record.ModelType] += record.TotalTokens
	}

	return projectTokenCntMap
}

func GetProjectAnalyticsByDateRange(
	ctx context.Context,
	projectID pgtype.UUID,
	fromDate, toDate time.Time,
) dto.ProjectAnalyticsDTO {
	totalAPICalls := GetProjectAPIRequestByDateRange(ctx, projectID, fromDate, toDate)

	projectTokenCntMap := GetProjectTokenCountByProjectByDateRange(
		ctx,
		projectID,
		fromDate,
		toDate,
	)

	var modelCost float64
	for model, tokenCnt := range projectTokenCntMap {
		modelCost += tokenutils.GetCostByModelType(tokenCnt, model)
	}

	return dto.ProjectAnalyticsDTO{
		TotalAPICalls: totalAPICalls,
		ModelsCost:    modelCost,
	}
}

package repositories

import (
	"context"
	"fmt"
	"github.com/basemind-ai/monorepo/shared/go/exc"
	"time"

	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/dto"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/tokenutils"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/rs/zerolog/log"
)

func CreateProject(
	ctx context.Context,
	userAccount *db.UserAccount,
	name string,
	description string,
) (*dto.ProjectDTO, error) {
	tx := exc.MustResult(db.GetOrCreateTx(ctx))

	queries := db.GetQueries().WithTx(tx)

	project, projectCreateErr := queries.CreateProject(ctx, db.CreateProjectParams{
		Name:        name,
		Description: description,
	})

	if projectCreateErr != nil {
		log.Error().Err(projectCreateErr).Msg("failed to create project")
		return nil, fmt.Errorf("failed to create project: %w", projectCreateErr)
	}

	userProject, userProjectCreateErr := queries.CreateUserProject(ctx, db.CreateUserProjectParams{
		UserID:     userAccount.ID,
		ProjectID:  project.ID,
		Permission: db.AccessPermissionTypeADMIN,
	})

	if userProjectCreateErr != nil {
		log.Error().Err(userProjectCreateErr).Msg("failed to create user project")
		return nil, fmt.Errorf("failed to create user project: %w", userProjectCreateErr)
	}

	if commitErr := tx.Commit(ctx); commitErr != nil {
		log.Error().Err(commitErr).Msg("failed to commit transaction")
		return nil, fmt.Errorf("failed to commit transaction: %w", commitErr)
	}

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

	defer func() {
		if rollbackErr := tx.Rollback(ctx); rollbackErr != nil {
			log.Error().Err(rollbackErr).Msg("failed to rollback transaction")
		}
	}()

	// we pass in the transaction into the nested function call via context
	transactionCtx := db.CreateTransactionContext(ctx, tx)
	// we are ensuring the nested operations should not commit the transaction
	shouldCommitCtx := db.CreateShouldCommitContext(transactionCtx, false)

	for _, application := range applications {
		if deleteErr := DeleteApplication(shouldCommitCtx, application.ID); deleteErr != nil {
			log.Error().Err(deleteErr).Msg("failed to delete application")
			return fmt.Errorf("failed to delete application: %w", deleteErr)
		}
	}

	if deleteErr := db.GetQueries().WithTx(tx).DeleteProject(ctx, projectID); deleteErr != nil {
		log.Error().Err(deleteErr).Msg("failed to delete project")
		return fmt.Errorf("failed to delete project: %w", deleteErr)
	}

	if commitErr := tx.Commit(ctx); commitErr != nil {
		log.Error().Err(commitErr).Msg("failed to commit transaction")
		return fmt.Errorf("failed to commit transaction: %w", commitErr)
	}

	return nil
}

func GetProjectAPIRequestByDateRange(
	ctx context.Context,
	projectID pgtype.UUID,
	fromDate, toDate time.Time,
) int64 {
	totalAPICalls := exc.MustResult(db.GetQueries().
		RetrieveProjectAPIRequestCount(ctx, db.RetrieveProjectAPIRequestCountParams{
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
) map[db.ModelType]int64 {
	tokensConsumed := exc.MustResult(db.GetQueries().
		RetrieveProjectTokensCount(ctx, db.RetrieveProjectTokensCountParams{
			ID:          projectID,
			CreatedAt:   pgtype.Timestamptz{Time: fromDate, Valid: true},
			CreatedAt_2: pgtype.Timestamptz{Time: toDate, Valid: true},
		}))

	projectTokenCntMap := make(map[db.ModelType]int64)
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

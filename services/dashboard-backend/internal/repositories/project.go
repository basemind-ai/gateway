package repositories

import (
	"context"
	"fmt"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/dto"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/rs/zerolog/log"
)

func CreateProject(
	ctx context.Context,
	firebaseId string,
	name string,
	description string,
) (*dto.ProjectDTO, error) {
	userAccount, retrievalErr := db.GetQueries().FindUserAccountByFirebaseId(ctx, firebaseId)
	if retrievalErr != nil {
		log.Error().Err(retrievalErr).Msg("failed to retrieve user account")
		return nil, fmt.Errorf("failed to retrieve user account: %w", retrievalErr)
	}

	tx, txErr := db.GetOrCreateTx(ctx)
	if txErr != nil {
		log.Error().Err(txErr).Msg("failed to create transaction")
		return nil, fmt.Errorf("failed to create transaction: %w", txErr)
	}

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

	projectId := db.UUIDToString(&project.ID)

	data := &dto.ProjectDTO{
		ID:                   projectId,
		Name:                 project.Name,
		Description:          project.Description,
		CreatedAt:            project.CreatedAt.Time,
		UpdatedAt:            project.UpdatedAt.Time,
		IsUserDefaultProject: false,
		Permission:           string(userProject.Permission),
		Applications:         nil,
	}

	return data, nil
}

func DeleteProject(ctx context.Context, projectId pgtype.UUID) error {
	applications, applicationsRetrievalErr := db.GetQueries().
		FindApplicationsByProjectId(ctx, projectId)

	if applicationsRetrievalErr != nil {
		log.Error().Err(applicationsRetrievalErr).Msg("failed to retrieve applications")
		return fmt.Errorf("failed to retrieve applications: %w", applicationsRetrievalErr)
	}

	tx, txErr := db.GetTransaction(ctx)
	if txErr != nil {
		log.Error().Err(txErr).Msg("failed to create transaction")
		return fmt.Errorf("failed to create transaction: %w", txErr)
	}
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

	if deleteErr := db.GetQueries().WithTx(tx).DeleteProject(ctx, projectId); deleteErr != nil {
		log.Error().Err(deleteErr).Msg("failed to delete project")
		return fmt.Errorf("failed to delete project: %w", deleteErr)
	}

	if commitErr := tx.Commit(ctx); commitErr != nil {
		log.Error().Err(commitErr).Msg("failed to commit transaction")
		return fmt.Errorf("failed to commit transaction: %w", commitErr)
	}

	return nil
}

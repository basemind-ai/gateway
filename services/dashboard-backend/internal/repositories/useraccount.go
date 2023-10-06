package repositories

import (
	"context"
	"fmt"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/dto"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/rs/zerolog/log"
)

// GetUserAccountData - retrieves the user data for the given firebase id,
// joins the user data with any projects the user has access to, and each project with its related applications.
func GetUserAccountData(ctx context.Context, firebaseId string) (*dto.UserAccountDTO, error) {
	data, findError := db.GetQueries().FindUserAccountData(ctx, firebaseId)
	if findError != nil {
		return nil, fmt.Errorf(
			"failed to find user data for firebase id: %s - %w",
			firebaseId,
			findError,
		)
	}

	userData := &dto.UserAccountDTO{
		FirebaseID: firebaseId,
		Projects:   make([]dto.ProjectDTO, 0),
	}

	projects := map[string]dto.ProjectDTO{}
	applications := map[string][]dto.ApplicationDTO{}

	for _, datum := range data {
		var (
			u = datum.UserID
			p = datum.ProjectID
			a = datum.ApplicationID
		)

		if userData.ID == "" {
			userData.ID = db.UUIDToString(&u)
		}

		projectId := db.UUIDToString(&p)
		applicationId := db.UUIDToString(&a)

		if _, ok := projects[projectId]; !ok {
			projects[projectId] = dto.ProjectDTO{
				ID:                   projectId,
				Name:                 datum.ProjectName.String,
				Description:          datum.ProjectDescription.String,
				CreatedAt:            datum.ProjectCreatedAt.Time,
				IsUserDefaultProject: datum.IsUserDefaultProject.Bool,
				Permission:           string(datum.Permission.AccessPermissionType),
			}
			applications[projectId] = []dto.ApplicationDTO{
				{
					ID:          applicationId,
					Name:        datum.ApplicationName.String,
					Description: datum.ApplicationDescription.String,
					CreatedAt:   datum.ApplicationCreatedAt.Time,
					UpdatedAt:   datum.ApplicationUpdatedAt.Time,
				},
			}
			continue
		}

		applications[projectId] = append(applications[projectId], dto.ApplicationDTO{
			ID:          applicationId,
			Name:        datum.ApplicationName.String,
			Description: datum.ApplicationDescription.String,
			CreatedAt:   datum.ApplicationCreatedAt.Time,
			UpdatedAt:   datum.ApplicationUpdatedAt.Time,
		})
	}

	for projectId, project := range projects {
		project.Applications = applications[projectId]
		userData.Projects = append(userData.Projects, project)
	}

	return userData, nil
}

// CreateDefaultUserAccountData - creates the user entry and a default project for the user.
func CreateDefaultUserAccountData(
	ctx context.Context,
	firebaseId string,
) (*dto.UserAccountDTO, error) {
	tx, err := db.GetTransaction(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get transaction queries - %w", err)
	}
	defer func() {
		if rollbackErr := tx.Rollback(ctx); rollbackErr != nil {
			log.Error().Err(rollbackErr).Msg("failed to rollback transaction")
		}
	}()

	queries := db.GetQueries().WithTx(tx)
	user, createUserErr := queries.CreateUserAccount(ctx, firebaseId)
	if createUserErr != nil {
		log.Error().Err(createUserErr).Msg("failed to create user")
		return nil, fmt.Errorf("failed to create user row - %w", createUserErr)
	}

	project, createProjectErr := queries.CreateProject(
		ctx,
		db.CreateProjectParams{Name: "Default Project", Description: "Default Project"},
	)
	if createProjectErr != nil {
		log.Error().Err(createProjectErr).Msg("failed to create project")
		return nil, fmt.Errorf("failed to create project row - %w", createProjectErr)
	}

	userProject, createUserProjectErr := queries.CreateUserProject(ctx, db.CreateUserProjectParams{
		UserID:               user.ID,
		ProjectID:            project.ID,
		Permission:           db.AccessPermissionTypeADMIN,
		IsUserDefaultProject: true,
	})

	if createUserProjectErr != nil {
		log.Error().Err(createUserProjectErr).Msg("failed to create user project")
		return nil, fmt.Errorf("failed to create user project row - %w", createUserProjectErr)
	}

	if commitErr := tx.Commit(ctx); commitErr != nil {
		if rollBackErr := tx.Rollback(ctx); rollBackErr != nil {
			log.Error().Err(rollBackErr).Msg("failed to rollback transaction")
			return nil, fmt.Errorf(
				"failed to rollback transaction - %w - %w",
				rollBackErr,
				commitErr,
			)
		}
		log.Error().Err(commitErr).Msg("failed to commit transaction")
		return nil, fmt.Errorf("failed to commit transaction - %w", commitErr)
	}

	return &dto.UserAccountDTO{
		ID:         db.UUIDToString(&user.ID),
		FirebaseID: firebaseId,
		Projects: []dto.ProjectDTO{
			{
				ID:                   db.UUIDToString(&project.ID),
				Name:                 project.Name,
				Description:          project.Description,
				CreatedAt:            project.CreatedAt.Time,
				IsUserDefaultProject: true,
				Permission:           string(userProject.Permission),
				Applications:         []dto.ApplicationDTO{},
			},
		},
	}, nil
}

// GetOrCreateUserAccount - checks if the user exists, returning the user account and all projects the user has
// access to.
// Note: this logic is temporary. We will rework it once we support inviting users to join a project.
func GetOrCreateUserAccount(ctx context.Context, firebaseId string) (*dto.UserAccountDTO, error) {
	userExists, queryErr := db.GetQueries().CheckUserAccountExists(ctx, firebaseId)

	if queryErr != nil {
		return nil, fmt.Errorf("failed to check if user exists - %w", queryErr)
	}

	if userExists {
		return GetUserAccountData(ctx, firebaseId)
	}

	return CreateDefaultUserAccountData(ctx, firebaseId)
}

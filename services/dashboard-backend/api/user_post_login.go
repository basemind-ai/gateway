package api

import (
	"context"
	"errors"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/constants"
	"github.com/basemind-ai/monorepo/shared/go/apierror"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"github.com/rs/zerolog/log"
	"net/http"
)

func HandleCreateNewUser(ctx context.Context, dbQueries *db.Queries, firebaseId string) (*HandleDashboardUserPostLoginDTO, error) {
	user, createUserErr := dbQueries.CreateUser(ctx, firebaseId)
	if createUserErr != nil {
		log.Error().Err(createUserErr).Msg("failed to create user row")
		return nil, createUserErr
	}

	project, createProjectErr := dbQueries.CreateProject(ctx, db.CreateProjectParams{Name: "Default Project", Description: "Default Project"})
	if createProjectErr != nil {
		log.Error().Err(createProjectErr).Msg("failed to create project row")
		return nil, createProjectErr
	}

	userProject, createUserProjectErr := dbQueries.CreateUserProject(ctx, db.CreateUserProjectParams{
		UserID:               user.ID,
		ProjectID:            project.ID,
		Permission:           db.AccessPermissionTypeADMIN,
		IsUserDefaultProject: true,
	})
	if createUserProjectErr != nil {
		log.Error().Err(createUserProjectErr).Msg("failed to create user project row")
		return nil, createUserProjectErr
	}

	var userProjects = []db.FindProjectsByUserIdRow{{
		ID:                   project.ID,
		CreatedAt:            project.CreatedAt,
		Name:                 project.Name,
		Description:          project.Description,
		Permission:           userProject.Permission,
		IsUserDefaultProject: userProject.IsUserDefaultProject,
	}}

	return &HandleDashboardUserPostLoginDTO{User: user, Projects: userProjects}, nil
}

func HandleRetrieveUserProjects(ctx context.Context, dbQueries *db.Queries, firebaseId string) (*HandleDashboardUserPostLoginDTO, error) {
	user, findUserErr := dbQueries.FindUserByFirebaseId(ctx, firebaseId)
	if findUserErr != nil {
		log.Error().Err(findUserErr).Msg("failed to find user")
		return nil, findUserErr
	}

	userProjects, findProjectsErr := dbQueries.FindProjectsByUserId(ctx, user.ID)
	if findProjectsErr != nil {
		log.Error().Err(findProjectsErr).Msg("failed to find user projects")
		return nil, findProjectsErr
	}

	if len(userProjects) == 0 {
		errMessage := "user does not have any projects"
		log.Error().Err(findProjectsErr).Msg(errMessage)
		return nil, errors.New(errMessage)
	}

	return &HandleDashboardUserPostLoginDTO{User: user, Projects: userProjects}, nil
}

func HandleDashboardUserPostLogin(w http.ResponseWriter, r *http.Request) {
	firebaseId := r.Context().Value(constants.FireBaseIdContextKey).(string)

	dbQueries := db.GetQueries()

	if userExists, userExistsErr := dbQueries.CheckUserExists(r.Context(), firebaseId); userExistsErr != nil {
		log.Error().Err(userExistsErr).Msg("failed to check user exists")
		_ = apierror.InternalServerError().Render(w, r)
		return
	} else if !userExists {
		responseDTO, err := HandleCreateNewUser(r.Context(), dbQueries, firebaseId)
		if err != nil {
			_ = apierror.InternalServerError().Render(w, r)
			return
		}
		_ = serialization.RenderJsonResponse(w, http.StatusOK, responseDTO)
		return
	} else {
		responseDTO, err := HandleRetrieveUserProjects(r.Context(), dbQueries, firebaseId)

		if err != nil {
			_ = apierror.InternalServerError().Render(w, r)
			return
		}
		_ = serialization.RenderJsonResponse(w, http.StatusOK, responseDTO)
	}
}

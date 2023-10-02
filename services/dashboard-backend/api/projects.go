package api

import (
	"context"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/middleware"
	"github.com/basemind-ai/monorepo/shared/go/apierror"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"github.com/rs/zerolog/log"
	"net/http"
)

func GetOrCreateUser(
	ctx context.Context,
	dbQueries *db.Queries,
	firebaseId string,
) (*db.User, error) {
	existingUser, findUserErr := dbQueries.FindUserByFirebaseId(ctx, firebaseId)
	if findUserErr == nil {
		return &existingUser, nil
	}

	user, createUserErr := dbQueries.CreateUser(ctx, firebaseId)
	if createUserErr != nil {
		log.Error().Err(createUserErr).Msg("failed to create user row")
		return nil, createUserErr
	}

	project, createProjectErr := dbQueries.CreateProject(
		ctx,
		db.CreateProjectParams{Name: "Default Project", Description: "Default Project"},
	)
	if createProjectErr != nil {
		log.Error().Err(createProjectErr).Msg("failed to create project row")
		return nil, createProjectErr
	}

	if _, createUserProjectErr := dbQueries.CreateUserProject(ctx, db.CreateUserProjectParams{
		UserID:               user.ID,
		ProjectID:            project.ID,
		Permission:           db.AccessPermissionTypeADMIN,
		IsUserDefaultProject: true,
	}); createUserProjectErr != nil {
		log.Error().Err(createUserProjectErr).Msg("failed to create user project row")
		return nil, createUserProjectErr
	}
	return &user, nil
}

// HandleRetrieveUserProjects is a handler called by the frontend after signup or login.
// because the user is managed by firebase, not our postgres, this function has two code paths-
// 1. user already exists, in which case it retrieves the projects for the user.
// 2. user is new, in which case it creates the user entry and the default project, retrieve this project.
func HandleRetrieveUserProjects(w http.ResponseWriter, r *http.Request) {
	firebaseId := r.Context().Value(middleware.FireBaseIdContextKey).(string)

	user, userRetrieveError := GetOrCreateUser(r.Context(), db.GetQueries(), firebaseId)

	if userRetrieveError != nil {
		log.Error().Err(userRetrieveError).Msg("failed to get or create user")
		apierror.InternalServerError().Render(w, r)
		return
	}
	userProjects, findProjectsErr := db.GetQueries().FindProjectsByUserId(r.Context(), user.ID)
	if findProjectsErr != nil {
		log.Error().Err(findProjectsErr).Msg("failed to find user projects")
		apierror.InternalServerError().Render(w, r)
		return
	}

	if len(userProjects) == 0 {
		errMessage := "user does not have any projects"
		log.Error().Err(findProjectsErr).Msg(errMessage)
		apierror.InternalServerError().Render(w, r)
		return
	}

	serialization.RenderJsonResponse(w, http.StatusOK, userProjects)
}

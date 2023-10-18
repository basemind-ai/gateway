package api

import (
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/dto"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/middleware"
	"github.com/basemind-ai/monorepo/shared/go/apierror"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/rs/zerolog/log"
	"net/http"
)

// handleRetrieveProjectUserAccounts - retrieves all users for a project.
func handleRetrieveProjectUserAccounts(w http.ResponseWriter, r *http.Request) {
	projectID := r.Context().Value(middleware.ProjectIDContextKey).(pgtype.UUID)

	userProjects, err := db.GetQueries().RetrieveProjectUserAccounts(r.Context(), projectID)
	if err != nil {
		log.Error().Err(err).Msg("failed to retrieve project user accounts")
		apierror.InternalServerError().Render(w, r)
		return
	}

	ret := make([]dto.ProjectUserAccountDTO, len(userProjects))
	for i, userProject := range userProjects {
		userID := userProject.ID
		ret[i] = dto.ProjectUserAccountDTO{
			ID:          db.UUIDToString(&userID),
			DisplayName: userProject.DisplayName,
			Email:       userProject.Email,
			PhoneNumber: userProject.PhoneNumber,
			PhotoURL:    userProject.PhotoUrl,
			CreatedAt:   userProject.CreatedAt.Time,
			Permission:  string(userProject.Permission.AccessPermissionType),
		}
	}

	serialization.RenderJSONResponse(w, http.StatusOK, ret)
}

// handleAddUserToProject - adds a user to a project with the specified permission level.
func handleAddUserToProject(w http.ResponseWriter, r *http.Request) {
	projectID := r.Context().Value(middleware.ProjectIDContextKey).(pgtype.UUID)

	data := dto.AddUserAccountToProjectDTO{}
	if deserializationErr := serialization.DeserializeJSON(r.Body, &data); deserializationErr != nil {
		log.Error().Err(deserializationErr).Msg("failed to deserialize request body")
		apierror.BadRequest(invalidRequestBodyError).Render(w, r)
		return
	}

	if validationErr := validate.Struct(data); validationErr != nil {
		log.Error().Err(validationErr).Msg("failed to validate request body")
		apierror.BadRequest(invalidRequestBodyError).Render(w, r)
		return
	}

	var (
		userAccount  db.UserAccount
		retrievalErr error
	)

	if data.Email != "" {
		userAccount, retrievalErr = db.GetQueries().
			RetrieveUserAccountByEmail(r.Context(), data.Email)
	} else {
		userID, err := db.StringToUUID(data.UserID)
		if err != nil {
			apierror.BadRequest(invalidRequestBodyError).Render(w, r)
			return
		}
		userAccount, retrievalErr = db.GetQueries().RetrieveUserAccountByID(r.Context(), *userID)
	}

	if retrievalErr != nil {
		log.Error().Err(retrievalErr).Msg("failed to retrieve user account")
		apierror.BadRequest("user does not exist").Render(w, r)
		return
	}

	userAlreadyInProject, checkErr := db.GetQueries().
		CheckUserProjectExists(r.Context(), db.CheckUserProjectExistsParams{
			ProjectID: projectID,
			UserID:    userAccount.ID,
		})

	if checkErr != nil {
		log.Error().Err(checkErr).Msg("failed to check if user is already in project")
		apierror.InternalServerError().Render(w, r)
		return
	}

	if userAlreadyInProject {
		apierror.BadRequest("user is already in project").Render(w, r)
		return
	}

	userProject, userProjectCreateErr := db.GetQueries().
		CreateUserProject(r.Context(), db.CreateUserProjectParams{
			ProjectID:  projectID,
			UserID:     userAccount.ID,
			Permission: data.Permission,
		})

	if userProjectCreateErr != nil {
		log.Error().Err(userProjectCreateErr).Msg("failed to create user project")
		apierror.InternalServerError().Render(w, r)
		return
	}

	serialization.RenderJSONResponse(w, http.StatusCreated, dto.ProjectUserAccountDTO{
		ID:          data.UserID,
		DisplayName: userAccount.DisplayName,
		Email:       userAccount.Email,
		PhoneNumber: userAccount.PhoneNumber,
		PhotoURL:    userAccount.PhotoUrl,
		CreatedAt:   userAccount.CreatedAt.Time,
		Permission:  string(userProject.Permission),
	})
}

// handleChangeUserProjectPermission - changes the user's permission to the one specified.
func handleChangeUserProjectPermission(w http.ResponseWriter, r *http.Request) {
	requestUserAccount := r.Context().Value(middleware.UserAccountContextKey).(*db.UserAccount)
	projectID := r.Context().Value(middleware.ProjectIDContextKey).(pgtype.UUID)

	data := dto.UpdateUserAccountProjectPermissionDTO{}
	if deserializationErr := serialization.DeserializeJSON(r.Body, &data); deserializationErr != nil {
		log.Error().Err(deserializationErr).Msg("failed to deserialize request body")
		apierror.BadRequest(invalidRequestBodyError).Render(w, r)
		return
	}

	if validationErr := validate.Struct(data); validationErr != nil {
		log.Error().Err(validationErr).Msg("failed to validate request body")
		apierror.BadRequest(invalidRequestBodyError).Render(w, r)
		return
	}

	if db.UUIDToString(&requestUserAccount.ID) == data.UserID {
		apierror.BadRequest("cannot change your own permission").Render(w, r)
		return
	}

	userID, err := db.StringToUUID(data.UserID)
	if err != nil {
		apierror.BadRequest(invalidRequestBodyError).Render(w, r)
		return
	}

	userInProject, checkErr := db.GetQueries().
		CheckUserProjectExists(r.Context(), db.CheckUserProjectExistsParams{
			ProjectID: projectID,
			UserID:    *userID,
		})

	if checkErr != nil {
		log.Error().Err(checkErr).Msg("failed to check if user is already in project")
		apierror.InternalServerError().Render(w, r)
		return
	}

	if !userInProject {
		apierror.BadRequest("user is not in project").Render(w, r)
		return
	}

	userAccount, retrievalErr := db.GetQueries().RetrieveUserAccountByID(r.Context(), *userID)

	if retrievalErr != nil {
		log.Error().Err(retrievalErr).Msg("failed to retrieve user account")
		apierror.BadRequest("user does not exist").Render(w, r)
		return
	}

	userProject, userProjectUpdateErr := db.GetQueries().
		UpdateUserProjectPermission(r.Context(), db.UpdateUserProjectPermissionParams{
			ProjectID:  projectID,
			UserID:     *userID,
			Permission: data.Permission,
		})

	if userProjectUpdateErr != nil {
		log.Error().Err(userProjectUpdateErr).Msg("failed to update user project")
		apierror.InternalServerError().Render(w, r)
		return
	}

	serialization.RenderJSONResponse(w, http.StatusOK, dto.ProjectUserAccountDTO{
		ID:          data.UserID,
		DisplayName: userAccount.DisplayName,
		Email:       userAccount.Email,
		PhoneNumber: userAccount.PhoneNumber,
		PhotoURL:    userAccount.PhotoUrl,
		CreatedAt:   userAccount.CreatedAt.Time,
		Permission:  string(userProject.Permission),
	})
}

// handleRemoveUserFromProject - removes a user from a project.
func handleRemoveUserFromProject(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDContextKey).(pgtype.UUID)
	requestUserAccount := r.Context().Value(middleware.UserAccountContextKey).(*db.UserAccount)
	projectID := r.Context().Value(middleware.ProjectIDContextKey).(pgtype.UUID)

	if db.UUIDToString(&userID) == db.UUIDToString(&requestUserAccount.ID) {
		apierror.BadRequest("cannot remove yourself from project").Render(w, r)
		return
	}

	userInProject, checkErr := db.GetQueries().
		CheckUserProjectExists(r.Context(), db.CheckUserProjectExistsParams{
			ProjectID: projectID,
			UserID:    userID,
		})

	if checkErr != nil {
		log.Error().Err(checkErr).Msg("failed to check if user is already in project")
		apierror.InternalServerError().Render(w, r)
		return
	}

	if !userInProject {
		apierror.BadRequest("user is not in project").Render(w, r)
		return
	}

	userAccountExists, checkErr := db.GetQueries().
		CheckUserAccountExists(r.Context(), requestUserAccount.FirebaseID)

	if checkErr != nil {
		log.Error().Err(checkErr).Msg("failed to check if user account exists")
		apierror.InternalServerError().Render(w, r)
		return
	}

	if !userAccountExists {
		apierror.BadRequest("user account does not exist").Render(w, r)
		return
	}

	if deleteErr := db.GetQueries().DeleteUserProject(r.Context(), db.DeleteUserProjectParams{
		ProjectID: projectID,
		UserID:    userID,
	}); deleteErr != nil {
		log.Error().Err(deleteErr).Msg("failed to delete user project")
		apierror.InternalServerError().Render(w, r)
	}

	w.WriteHeader(http.StatusNoContent)
}

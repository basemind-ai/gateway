package api

import (
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/dto"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/middleware"
	"github.com/basemind-ai/monorepo/shared/go/apierror"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/db/models"
	"github.com/basemind-ai/monorepo/shared/go/exc"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/rs/zerolog/log"
	"net/http"
)

// handleRetrieveProjectUserAccounts - retrieves all users for a project.
func handleRetrieveProjectUserAccounts(w http.ResponseWriter, r *http.Request) {
	projectID := r.Context().Value(middleware.ProjectIDContextKey).(pgtype.UUID)

	userProjects := exc.MustResult(
		db.GetQueries().RetrieveProjectUserAccounts(r.Context(), projectID),
	)

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
		apierror.BadRequest(invalidRequestBodyError).Render(w)
		return
	}

	if validationErr := validate.Struct(data); validationErr != nil {
		log.Error().Err(validationErr).Msg("failed to validate request body")
		apierror.BadRequest(invalidRequestBodyError).Render(w)
		return
	}

	var (
		userAccount  models.UserAccount
		retrievalErr error
	)

	if data.Email != "" {
		userAccount, retrievalErr = db.GetQueries().
			RetrieveUserAccountByEmail(r.Context(), data.Email)
	} else {
		userID, err := db.StringToUUID(data.UserID)
		if err != nil {
			apierror.BadRequest(invalidRequestBodyError).Render(w)
			return
		}
		userAccount, retrievalErr = db.GetQueries().RetrieveUserAccountByID(r.Context(), *userID)
	}

	if retrievalErr != nil {
		log.Error().Err(retrievalErr).Msg("failed to retrieve user account")
		apierror.BadRequest("user does not exist").Render(w)
		return
	}

	userAlreadyInProject := exc.MustResult(db.GetQueries().
		CheckUserProjectExists(r.Context(), models.CheckUserProjectExistsParams{
			ProjectID: projectID,
			UserID:    userAccount.ID,
		}))

	if userAlreadyInProject {
		apierror.BadRequest("user is already in project").Render(w)
		return
	}

	userProject := exc.MustResult(db.GetQueries().
		CreateUserProject(r.Context(), models.CreateUserProjectParams{
			ProjectID:  projectID,
			UserID:     userAccount.ID,
			Permission: data.Permission,
		}))

	serialization.RenderJSONResponse(w, http.StatusCreated, dto.ProjectUserAccountDTO{
		ID:          db.UUIDToString(&userAccount.ID),
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
	requestUserAccount := r.Context().Value(middleware.UserAccountContextKey).(*models.UserAccount)
	projectID := r.Context().Value(middleware.ProjectIDContextKey).(pgtype.UUID)

	data := dto.UpdateUserAccountProjectPermissionDTO{}
	if deserializationErr := serialization.DeserializeJSON(r.Body, &data); deserializationErr != nil {
		log.Error().Err(deserializationErr).Msg("failed to deserialize request body")
		apierror.BadRequest(invalidRequestBodyError).Render(w)
		return
	}

	if validationErr := validate.Struct(data); validationErr != nil {
		log.Error().Err(validationErr).Msg("failed to validate request body")
		apierror.BadRequest(invalidRequestBodyError).Render(w)
		return
	}

	if db.UUIDToString(&requestUserAccount.ID) == data.UserID {
		apierror.BadRequest("cannot change your own permission").Render(w)
		return
	}

	userID, err := db.StringToUUID(data.UserID)
	if err != nil {
		apierror.BadRequest(invalidRequestBodyError).Render(w)
		return
	}

	userInProject := exc.MustResult(db.GetQueries().
		CheckUserProjectExists(r.Context(), models.CheckUserProjectExistsParams{
			ProjectID: projectID,
			UserID:    *userID,
		}))

	if !userInProject {
		apierror.BadRequest("user is not in project").Render(w)
		return
	}

	userAccount := exc.MustResult(db.GetQueries().RetrieveUserAccountByID(r.Context(), *userID))

	userProject := exc.MustResult(db.GetQueries().
		UpdateUserProjectPermission(r.Context(), models.UpdateUserProjectPermissionParams{
			ProjectID:  projectID,
			UserID:     *userID,
			Permission: data.Permission,
		}))

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
	requestUserAccount := r.Context().Value(middleware.UserAccountContextKey).(*models.UserAccount)
	projectID := r.Context().Value(middleware.ProjectIDContextKey).(pgtype.UUID)

	if db.UUIDToString(&userID) == db.UUIDToString(&requestUserAccount.ID) {
		apierror.BadRequest("cannot remove yourself from project").Render(w)
		return
	}

	userInProject := exc.MustResult(db.GetQueries().
		CheckUserProjectExists(r.Context(), models.CheckUserProjectExistsParams{
			ProjectID: projectID,
			UserID:    userID,
		}))

	if !userInProject {
		apierror.BadRequest("user is not in project").Render(w)
		return
	}

	exc.Must(db.GetQueries().DeleteUserProject(r.Context(), models.DeleteUserProjectParams{
		ProjectID: projectID,
		UserID:    userID,
	}))

	w.WriteHeader(http.StatusNoContent)
}

package api

import (
	"cloud.google.com/go/pubsub"
	"context"
	"encoding/json"
	"fmt"
	"github.com/basemind-ai/monorepo/cloud-functions/emailsender"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/dto"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/middleware"
	"github.com/basemind-ai/monorepo/shared/go/apierror"
	"github.com/basemind-ai/monorepo/shared/go/config"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/db/models"
	"github.com/basemind-ai/monorepo/shared/go/exc"
	"github.com/basemind-ai/monorepo/shared/go/pubsubutils"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"github.com/basemind-ai/monorepo/shared/go/urlutils"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/rs/zerolog/log"
	"net/http"
	"sync"
	"time"
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

// handleInviteUsersToProject - adds a user to a project with the specified permission level.
func handleInviteUsersToProject(w http.ResponseWriter, r *http.Request) {
	userAccount := r.Context().Value(middleware.UserAccountContextKey).(*models.UserAccount)
	projectID := r.Context().Value(middleware.ProjectIDContextKey).(pgtype.UUID)

	data := make([]dto.AddUserAccountToProjectDTO, 0)
	if deserializationErr := serialization.DeserializeJSON(r.Body, &data); deserializationErr != nil {
		log.Error().Err(deserializationErr).Msg("failed to deserialize request body")
		apierror.BadRequest(invalidRequestBodyError).Render(w)
		return
	}

	for _, datum := range data {
		if validationErr := validate.Struct(datum); validationErr != nil {
			log.Error().Err(validationErr).Msg("failed to validate request body")
			apierror.BadRequest(invalidRequestBodyError).Render(w)
			return
		}
		if userAlreadyInProject := exc.MustResult(db.GetQueries().
			CheckUserProjectExists(r.Context(), models.CheckUserProjectExistsParams{
				ProjectID: projectID,
				Email:     datum.Email,
			})); userAlreadyInProject {
			apierror.BadRequest(fmt.Sprintf("user account with email %s is already in the project", datum.Email)).
				Render(w)
			return
		}
	}

	cfg := config.Get(r.Context())
	project := exc.MustResult(db.GetQueries().RetrieveProject(r.Context(), projectID))

	topic := pubsubutils.GetTopic(r.Context(), pubsubutils.EmailSenderPubSubTopicID)

	baseURL := fmt.Sprintf(
		"https://%s/v1%s",
		cfg.ServerHost,
		InviteUserWebhookEndpoint,
	)

	if cfg.ServerHost == "localhost" {
		baseURL = fmt.Sprintf(
			"http://%s:%d/v1%s",
			cfg.ServerHost,
			cfg.ServerPort,
			InviteUserWebhookEndpoint,
		)
	}

	var wg sync.WaitGroup

	publishContext, cancel := context.WithTimeout(
		context.Background(),
		1*time.Minute,
	)

	defer cancel()

	for _, datum := range data {
		toName := ""
		pictureURL := ""
		if invitedUser, retrievalErr := db.GetQueries().RetrieveUserAccountByEmail(r.Context(), datum.Email); retrievalErr == nil {
			toName = invitedUser.DisplayName
			pictureURL = invitedUser.PhotoUrl
		}

		invitation := exc.MustResult(db.GetQueries().
			UpsertProjectInvitation(r.Context(), models.UpsertProjectInvitationParams{
				ProjectID:  projectID,
				Email:      datum.Email,
				Permission: datum.Permission,
			}))

		invitationID := db.UUIDToString(&invitation.ID)

		signedURL, err := urlutils.SignURL(
			r.Context(),
			fmt.Sprintf("%s?invitationId=%s", baseURL, invitationID),
		)
		if err != nil {
			log.Error().Err(err).Msg("failed to sign url")
			apierror.InternalServerError().Render(w)
			return
		}

		pubsubMessageData := exc.MustResult(json.Marshal(emailsender.SendEmailRequestDTO{
			FromName:    "BaseMind.AI",
			FromAddress: SupportEmailAddress,
			ToName:      toName,
			ToAddress:   datum.Email,
			TemplateID:  UserInvitationEmailTemplateID,
			TemplateVariables: map[string]string{
				"invitationUrl":        signedURL,
				"invitingUserFullName": userAccount.DisplayName,
				"pictureUrl":           pictureURL,
				"projectName":          project.Name,
			},
		}))

		wg.Add(1)

		go func(ctx context.Context) {
			defer wg.Done()
			exc.Must(
				pubsubutils.PublishWithRetry(
					ctx,
					topic,
					&pubsub.Message{Data: pubsubMessageData},
				),
			)
		}(publishContext)
	}

	wg.Wait()

	serialization.RenderJSONResponse(w, http.StatusCreated, nil)
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

	user, retrievalErr := db.GetQueries().RetrieveUserAccountByID(r.Context(), *userID)
	if retrievalErr != nil {
		log.Error().Err(retrievalErr).Msg("failed to retrieve user account")
		apierror.BadRequest("user does not exist").Render(w)
		return
	}

	userInProject := exc.MustResult(db.GetQueries().
		CheckUserProjectExists(r.Context(), models.CheckUserProjectExistsParams{
			ProjectID: projectID,
			Email:     user.Email,
		}))

	if !userInProject {
		apierror.BadRequest("user is not in project").Render(w)
		return
	}

	userAccount, retrievalErr := db.GetQueries().RetrieveUserAccountByID(r.Context(), *userID)
	if retrievalErr != nil {
		log.Error().Err(retrievalErr).Msg("failed to retrieve user account")
		apierror.BadRequest("user does not exist").Render(w)
		return
	}

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

	user, retrievalErr := db.GetQueries().RetrieveUserAccountByID(r.Context(), userID)
	if retrievalErr != nil {
		log.Error().Err(retrievalErr).Msg("failed to retrieve user account")
		apierror.BadRequest("user does not exist").Render(w)
		return
	}

	userInProject := exc.MustResult(db.GetQueries().
		CheckUserProjectExists(r.Context(), models.CheckUserProjectExistsParams{
			ProjectID: projectID,
			Email:     user.Email,
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

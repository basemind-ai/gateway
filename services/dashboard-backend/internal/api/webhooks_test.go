package api_test

import (
	"context"
	"fmt"
	"github.com/basemind-ai/monorepo/e2e/factories"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/api"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/middleware"
	"github.com/basemind-ai/monorepo/shared/go/config"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/db/models"
	"github.com/basemind-ai/monorepo/shared/go/exc"
	"github.com/basemind-ai/monorepo/shared/go/router"
	"github.com/basemind-ai/monorepo/shared/go/testutils"
	"github.com/basemind-ai/monorepo/shared/go/urlutils"
	"github.com/stretchr/testify/assert"
	"net/http"
	"strings"
	"testing"
)

func TestWebhooksAPI(t *testing.T) {
	testutils.SetTestEnv(t)

	project, _ := factories.CreateProject(context.TODO())

	testClient := testutils.CreateTestHTTPClient(t, router.New(router.Options{
		Environment:      "test",
		ServiceName:      "test",
		RegisterHandlers: api.RegisterHandlers,
		Middlewares: []func(next http.Handler) http.Handler{
			middleware.FirebaseAuthMiddleware,
		},
	}))

	// we have to fake the frontend here for the redirect to be testable
	frontendServer := testutils.CreateTestHTTPClient(t,
		http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
		}))

	t.Setenv("FRONTEND_BASE_URL", frontendServer.BaseURL)
	config.Get(context.Background()).FrontendBaseURL = frontendServer.BaseURL

	createSignedURL := func(invitationID string) string {
		url := fmt.Sprintf(
			"%s/v1%s?invitationId=%s",
			testClient.BaseURL,
			api.InviteUserWebhookEndpoint, invitationID,
		)
		signedURL := exc.MustResult(urlutils.SignURL(context.TODO(), url))
		urlWithoutBase, _ := strings.CutPrefix(signedURL, testClient.BaseURL)
		return urlWithoutBase
	}

	t.Run(fmt.Sprintf("GET: %s", api.InviteUserWebhookEndpoint), func(t *testing.T) {
		t.Run("should create user and redirect when user does not exist", func(t *testing.T) {
			email := "moishe1@zuchmir.com"

			invitation, err := db.GetQueries().
				UpsertProjectInvitation(context.TODO(), models.UpsertProjectInvitationParams{
					Email:      email,
					Permission: models.AccessPermissionTypeMEMBER,
					ProjectID:  project.ID,
				})
			assert.NoError(t, err)

			invitationID := db.UUIDToString(&invitation.ID)
			signedURL := createSignedURL(invitationID)

			response, requestErr := testClient.Get(
				context.TODO(),
				signedURL,
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusPermanentRedirect, response.StatusCode)

			userAccount, retrievalErr := db.GetQueries().
				RetrieveUserAccountByEmail(context.TODO(), email)

			assert.NoError(t, retrievalErr)
			assert.Equal(t, userAccount.Email, email)

			exists, checkErr := db.GetQueries().
				CheckUserProjectExists(context.TODO(), models.CheckUserProjectExistsParams{
					Email:     email,
					ProjectID: project.ID,
				})

			assert.NoError(t, checkErr)
			assert.True(t, exists)
		})

		t.Run(
			"should create a user-project and redirect when a user exists without a user-project",
			func(t *testing.T) {
				userAccount, _ := factories.CreateUserAccount(context.TODO())

				invitation, err := db.GetQueries().
					UpsertProjectInvitation(context.TODO(), models.UpsertProjectInvitationParams{
						Email:      userAccount.Email,
						Permission: models.AccessPermissionTypeADMIN,
						ProjectID:  project.ID,
					})
				assert.NoError(t, err)

				invitationID := db.UUIDToString(&invitation.ID)
				signedURL := createSignedURL(invitationID)

				response, requestErr := testClient.Get(
					context.TODO(),
					signedURL,
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusPermanentRedirect, response.StatusCode)

				exists, checkErr := db.GetQueries().
					CheckUserProjectExists(context.TODO(), models.CheckUserProjectExistsParams{
						Email:     userAccount.Email,
						ProjectID: project.ID,
					})

				assert.NoError(t, checkErr)
				assert.True(t, exists)
			},
		)

		t.Run("should redirect when a user-project exists", func(t *testing.T) {
			userAccount, _ := factories.CreateUserAccount(context.TODO())
			_, _ = db.GetQueries().CreateUserProject(context.TODO(), models.CreateUserProjectParams{
				UserID:     userAccount.ID,
				ProjectID:  project.ID,
				Permission: models.AccessPermissionTypeADMIN,
			})

			invitation, err := db.GetQueries().
				UpsertProjectInvitation(context.TODO(), models.UpsertProjectInvitationParams{
					Email:      userAccount.Email,
					Permission: models.AccessPermissionTypeADMIN,
					ProjectID:  project.ID,
				})
			assert.NoError(t, err)

			invitationID := db.UUIDToString(&invitation.ID)
			signedURL := createSignedURL(invitationID)

			response, requestErr := testClient.Get(
				context.TODO(),
				signedURL,
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusPermanentRedirect, response.StatusCode)
		})

		t.Run(
			"responds with 400 BAD REQUEST when the invitation ID is invalid",
			func(t *testing.T) {
				signedURL := createSignedURL("invalid")

				response, requestErr := testClient.Get(
					context.TODO(),
					signedURL,
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			},
		)

		t.Run(
			"responds with 308 Permanent Redirect and redirect the user when no invite exists with the given ID",
			func(t *testing.T) {
				signedURL := createSignedURL(
					"b50e5477-f74a-4e80-be29-ae67eb6ada95",
				)

				response, requestErr := testClient.Get(
					context.TODO(),
					signedURL,
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusPermanentRedirect, response.StatusCode)
			},
		)

		t.Run(
			"responds with 403 FORBIDDEN if the signed URL has manipulated invitationID",
			func(t *testing.T) {
				userAccount, _ := factories.CreateUserAccount(context.TODO())

				invitation, err := db.GetQueries().
					UpsertProjectInvitation(context.TODO(), models.UpsertProjectInvitationParams{
						Email:      userAccount.Email,
						Permission: models.AccessPermissionTypeADMIN,
						ProjectID:  project.ID,
					})
				assert.NoError(t, err)

				invitationID := db.UUIDToString(&invitation.ID)
				signedURL := createSignedURL(invitationID)

				secondInvitation := exc.MustResult(
					db.GetQueries().
						UpsertProjectInvitation(context.TODO(), models.UpsertProjectInvitationParams{
							Email:      "some@email.com",
							Permission: models.AccessPermissionTypeMEMBER,
							ProjectID:  project.ID,
						}),
				)

				signedURL = strings.ReplaceAll(
					signedURL,
					invitationID,
					db.UUIDToString(&secondInvitation.ID),
				)

				response, requestErr := testClient.Get(
					context.TODO(),
					signedURL,
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusForbidden, response.StatusCode)
			},
		)
	})
}

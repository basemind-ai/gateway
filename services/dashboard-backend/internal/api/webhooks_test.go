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

	createSignedURL := func(permission models.AccessPermissionType, email string, projectId string) string {
		url := fmt.Sprintf(
			"%s/v1%s?projectId=%s&permission=%s&email=%s",
			testClient.BaseURL,
			api.InviteUserWebhookEndpoint,
			projectId,
			permission,
			email,
		)
		signedURL := exc.MustResult(urlutils.SignURL(context.TODO(), url))
		urlWithoutBase, _ := strings.CutPrefix(signedURL, testClient.BaseURL)
		return urlWithoutBase
	}

	t.Run(fmt.Sprintf("GET: %s", api.InviteUserWebhookEndpoint), func(t *testing.T) {
		t.Run("should create user and redirect when user does not exist", func(t *testing.T) {
			email := "moishe1@zuchmir.com"
			signedURL := createSignedURL(
				models.AccessPermissionTypeMEMBER,
				email,
				db.UUIDToString(&project.ID),
			)

			response, requestErr := testClient.Get(
				context.TODO(),
				signedURL,
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusOK, response.StatusCode)

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
				signedURL := createSignedURL(
					models.AccessPermissionTypeADMIN,
					userAccount.Email,
					db.UUIDToString(&project.ID),
				)

				response, requestErr := testClient.Get(
					context.TODO(),
					signedURL,
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusOK, response.StatusCode)

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

			signedURL := createSignedURL(
				models.AccessPermissionTypeADMIN,
				userAccount.Email,
				db.UUIDToString(&project.ID),
			)

			response, requestErr := testClient.Get(
				context.TODO(),
				signedURL,
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusOK, response.StatusCode)
		})

		t.Run("responds with 400 BAD REQUEST when the project ID is invalid", func(t *testing.T) {
			email := "moishe1@zuchmir.com"
			signedURL := createSignedURL(models.AccessPermissionTypeADMIN, email, "invalid")

			response, requestErr := testClient.Get(
				context.TODO(),
				signedURL,
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusBadRequest, response.StatusCode)
		})

		t.Run(
			"responds with 400 BAD REQUEST when no project exists with the given ID",
			func(t *testing.T) {
				email := "moishe1@zuchmir.com"
				signedURL := createSignedURL(
					models.AccessPermissionTypeADMIN,
					email,
					"b50e5477-f74a-4e80-be29-ae67eb6ada95",
				)

				response, requestErr := testClient.Get(
					context.TODO(),
					signedURL,
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			},
		)

		t.Run("responds with 400 BAD REQUEST when the permission is invalid", func(t *testing.T) {
			email := "moishe1@zuchmir.com"
			signedURL := createSignedURL(
				models.AccessPermissionType("invalid"),
				email,
				db.UUIDToString(&project.ID),
			)

			response, requestErr := testClient.Get(
				context.TODO(),
				signedURL,
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusBadRequest, response.StatusCode)
		})

		t.Run("responds with 400 BAD REQUEST when the email is invalid", func(t *testing.T) {
			signedURL := createSignedURL(
				models.AccessPermissionTypeMEMBER,
				"",
				db.UUIDToString(&project.ID),
			)

			response, requestErr := testClient.Get(
				context.TODO(),
				signedURL,
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusBadRequest, response.StatusCode)
		})

		t.Run(
			"responds with 403 FORBIDDEN if the signed URL has manipulated email",
			func(t *testing.T) {
				userAccount, _ := factories.CreateUserAccount(context.TODO())
				signedURL := strings.ReplaceAll(
					createSignedURL(
						models.AccessPermissionTypeADMIN,
						userAccount.Email,
						db.UUIDToString(&project.ID),
					),
					"zuchmir",
					"x",
				)

				response, requestErr := testClient.Get(
					context.TODO(),
					signedURL,
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusForbidden, response.StatusCode)
			},
		)

		t.Run(
			"responds with 403 FORBIDDEN if the signed URL has manipulated permission",
			func(t *testing.T) {
				userAccount, _ := factories.CreateUserAccount(context.TODO())
				signedURL := strings.ReplaceAll(
					createSignedURL(
						models.AccessPermissionTypeMEMBER,
						userAccount.Email,
						db.UUIDToString(&project.ID),
					),
					string(models.AccessPermissionTypeMEMBER),
					string(models.AccessPermissionTypeADMIN),
				)

				response, requestErr := testClient.Get(
					context.TODO(),
					signedURL,
				)
				assert.NoError(t, requestErr)
				assert.Equal(t, http.StatusForbidden, response.StatusCode)
			},
		)

		t.Run("responds with 403 FORBIDDEN if the project ID is manipulated", func(t *testing.T) {
			userAccount, _ := factories.CreateUserAccount(context.TODO())
			newProject, _ := factories.CreateProject(context.TODO())
			signedURL := strings.ReplaceAll(
				createSignedURL(
					models.AccessPermissionTypeMEMBER,
					userAccount.Email,
					db.UUIDToString(&project.ID),
				),
				db.UUIDToString(&project.ID),
				db.UUIDToString(&newProject.ID),
			)

			response, requestErr := testClient.Get(
				context.TODO(),
				signedURL,
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusForbidden, response.StatusCode)
		})
	})
}

package api

import (
	"github.com/basemind-ai/monorepo/shared/go/db/models"
	"net/http"

	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/middleware"
	"github.com/go-chi/chi/v5"
	"github.com/go-playground/validator/v10"
)

var (
	validate       = validator.New(validator.WithRequiredStructEnabled())
	allPermissions = []models.AccessPermissionType{
		models.AccessPermissionTypeMEMBER,
		models.AccessPermissionTypeADMIN,
	}
	adminOnly = []models.AccessPermissionType{models.AccessPermissionTypeADMIN}
)

func RegisterHandlers(mux *chi.Mux) {
	mux.Route("/v1", func(router chi.Router) {
		router.Route(ProjectsListEndpoint, func(subRouter chi.Router) {
			subRouter.Get("/", handleRetrieveProjects)
			subRouter.Post("/", handleCreateProject)
		})

		router.Route(ProjectDetailEndpoint, func(subRouter chi.Router) {
			subRouter.Use(middleware.PathParameterMiddleware("projectId"))
			subRouter.Use(
				middleware.AuthorizationMiddleware(
					middleware.MethodPermissionMap{
						http.MethodDelete: adminOnly,
						http.MethodPatch:  adminOnly,
					},
				),
			)
			subRouter.Delete("/", handleDeleteProject)
			subRouter.Patch("/", handleUpdateProject)
		})

		router.Route(ProjectInvitationListEndpoint, func(subRouter chi.Router) {
			subRouter.Use(middleware.PathParameterMiddleware("projectId"))
			subRouter.Use(
				middleware.AuthorizationMiddleware(
					middleware.MethodPermissionMap{
						http.MethodGet: allPermissions,
					},
				),
			)
			subRouter.Get("/", handleRetrieveProjectInvitations)
		})

		router.Route(ProjectInvitationDetailEndpoint, func(subRouter chi.Router) {
			subRouter.Use(middleware.PathParameterMiddleware("projectId", "projectInvitationId"))
			subRouter.Use(
				middleware.AuthorizationMiddleware(
					middleware.MethodPermissionMap{
						http.MethodDelete: adminOnly,
					},
				),
			)
			subRouter.Delete("/", handleDeleteProjectInvitation)
		})

		router.Route(ProjectOTPEndpoint, func(subRouter chi.Router) {
			subRouter.Use(
				middleware.PathParameterMiddleware("projectId"),
			)
			subRouter.Use(
				middleware.AuthorizationMiddleware(
					middleware.MethodPermissionMap{
						http.MethodGet: allPermissions,
					},
				),
			)
			subRouter.Get("/", handleRetrieveProjectOTP)
		})

		router.Route(ProjectProviderKeyListEndpoint, func(subRouter chi.Router) {
			subRouter.Use(
				middleware.PathParameterMiddleware("projectId"),
			)
			subRouter.Use(
				middleware.AuthorizationMiddleware(
					middleware.MethodPermissionMap{
						http.MethodGet:  allPermissions,
						http.MethodPost: allPermissions,
					},
				),
			)
			subRouter.Get("/", handleRetrieveProviderKeys)
			subRouter.Post("/", handleCreateProviderKey)
		})

		router.Route(ProjectProviderKeyDetailEndpoint, func(subRouter chi.Router) {
			subRouter.Use(
				middleware.PathParameterMiddleware("projectId", "providerKeyId"),
			)
			subRouter.Use(
				middleware.AuthorizationMiddleware(
					middleware.MethodPermissionMap{
						http.MethodDelete: adminOnly,
					},
				),
			)
			subRouter.Delete("/", handleDeleteProviderKey)
		})

		router.Route(ProjectAnalyticsEndpoint, func(subRouter chi.Router) {
			subRouter.Use(middleware.PathParameterMiddleware("projectId"))
			subRouter.Use(
				middleware.AuthorizationMiddleware(
					middleware.MethodPermissionMap{
						http.MethodGet: allPermissions,
					},
				),
			)
			subRouter.Get("/", handleRetrieveProjectAnalytics)
		})

		router.Route(ProjectUserListEndpoint, func(subRouter chi.Router) {
			subRouter.Use(middleware.PathParameterMiddleware("projectId"))
			subRouter.Use(
				middleware.AuthorizationMiddleware(
					middleware.MethodPermissionMap{
						http.MethodGet:   allPermissions,
						http.MethodPatch: adminOnly,
						http.MethodPost:  adminOnly,
					},
				),
			)
			subRouter.Get("/", handleRetrieveProjectUserAccounts)
			subRouter.Patch("/", handleChangeUserProjectPermission)
			subRouter.Post("/", handleInviteUsersToProject)
		})

		router.Route(ProjectUserDetailEndpoint, func(subRouter chi.Router) {
			subRouter.Use(middleware.PathParameterMiddleware("projectId", "userId"))
			subRouter.Use(
				middleware.AuthorizationMiddleware(
					middleware.MethodPermissionMap{
						http.MethodDelete: adminOnly,
					},
				),
			)
			subRouter.Delete("/", handleRemoveUserFromProject)
		})

		router.Route(ApplicationsListEndpoint, func(subRouter chi.Router) {
			subRouter.Use(middleware.PathParameterMiddleware("projectId"))
			subRouter.Use(
				middleware.AuthorizationMiddleware(
					middleware.MethodPermissionMap{
						http.MethodPost: allPermissions,
						http.MethodGet:  allPermissions,
					},
				),
			)
			subRouter.Get("/", handleRetrieveApplications)
			subRouter.Post("/", handleCreateApplication)
		})

		router.Route(ApplicationDetailEndpoint, func(subRouter chi.Router) {
			subRouter.Use(middleware.PathParameterMiddleware("projectId", "applicationId"))
			subRouter.Use(
				middleware.AuthorizationMiddleware(
					middleware.MethodPermissionMap{
						http.MethodDelete: adminOnly,
						http.MethodGet:    allPermissions,
						http.MethodPatch:  adminOnly,
					},
				),
			)
			subRouter.Delete("/", handleDeleteApplication)
			subRouter.Get("/", handleRetrieveApplication)
			subRouter.Patch("/", handleUpdateApplication)
		})

		router.Route(ApplicationAnalyticsEndpoint, func(subRouter chi.Router) {
			subRouter.Use(middleware.PathParameterMiddleware("projectId", "applicationId"))
			subRouter.Use(
				middleware.AuthorizationMiddleware(
					middleware.MethodPermissionMap{
						http.MethodGet: allPermissions,
					},
				),
			)
			subRouter.Get("/", handleRetrieveApplicationAnalytics)
		})

		router.Route(ApplicationAPIKeysListEndpoint, func(subRouter chi.Router) {
			subRouter.Use(
				middleware.PathParameterMiddleware("projectId", "applicationId"),
			)
			subRouter.Use(
				middleware.AuthorizationMiddleware(
					middleware.MethodPermissionMap{
						http.MethodGet:  allPermissions,
						http.MethodPost: allPermissions,
					},
				),
			)
			subRouter.Get("/", handleRetrieveApplicationAPIKeys)
			subRouter.Post("/", handleCreateApplicationAPIKey)
		})

		router.Route(ApplicationAPIKeyDetailEndpoint, func(subRouter chi.Router) {
			subRouter.Use(
				middleware.PathParameterMiddleware("projectId", "applicationId", "apiKeyId"),
			)
			subRouter.Use(
				middleware.AuthorizationMiddleware(
					middleware.MethodPermissionMap{
						http.MethodDelete: adminOnly,
					},
				),
			)
			subRouter.Delete("/", handleDeleteApplicationAPIKey)
		})

		router.Route(InviteUserWebhookEndpoint, func(subRouter chi.Router) {
			subRouter.Get("/", handleUserInvitationWebhook)
		})

		router.Route(PromptConfigListEndpoint, func(subRouter chi.Router) {
			subRouter.Use(middleware.PathParameterMiddleware("projectId", "applicationId"))
			subRouter.Use(
				middleware.AuthorizationMiddleware(
					middleware.MethodPermissionMap{
						http.MethodGet:  allPermissions,
						http.MethodPost: allPermissions,
					},
				),
			)
			subRouter.Get("/", handleRetrievePromptConfigs)
			subRouter.Post("/", handleCreatePromptConfig)
		})

		router.Route(PromptConfigAnalyticsEndpoint, func(subRouter chi.Router) {
			subRouter.Use(
				middleware.PathParameterMiddleware("projectId", "applicationId", "promptConfigId"),
			)
			subRouter.Use(
				middleware.AuthorizationMiddleware(
					middleware.MethodPermissionMap{
						http.MethodGet: allPermissions,
					},
				),
			)
			subRouter.Get("/", handlePromptConfigAnalytics)
		})

		router.Route(PromptConfigDetailEndpoint, func(subRouter chi.Router) {
			subRouter.Use(
				middleware.PathParameterMiddleware("projectId", "applicationId", "promptConfigId"),
			)
			subRouter.Use(
				middleware.AuthorizationMiddleware(
					middleware.MethodPermissionMap{
						http.MethodDelete: adminOnly,
						http.MethodPatch:  adminOnly,
					},
				),
			)
			subRouter.Delete("/", handleDeletePromptConfig)
			subRouter.Patch("/", handleUpdatePromptConfig)
		})

		router.Route(PromptConfigSetDefaultEndpoint, func(subRouter chi.Router) {
			subRouter.Use(
				middleware.PathParameterMiddleware("projectId", "applicationId", "promptConfigId"),
			)
			subRouter.Use(
				middleware.AuthorizationMiddleware(
					middleware.MethodPermissionMap{
						http.MethodPatch: adminOnly,
					},
				),
			)
			subRouter.Patch("/", handleSetApplicationDefaultPromptConfig)
		})
		router.Route(PromptConfigTestingEndpoint, func(subRouter chi.Router) {
			subRouter.Use(
				middleware.PathParameterMiddleware("projectId", "applicationId"),
			)
			subRouter.Use(
				middleware.AuthorizationMiddleware(
					middleware.MethodPermissionMap{
						http.MethodGet: allPermissions,
					},
				),
			)

			// we are mounting the websocket here instead of using a regular route because we need chi to pass control.
			subRouter.Mount("/", http.HandlerFunc(promptTestingWebsocketHandler))
		})
		router.Route(PromptTestRecordListEndpoint, func(subRouter chi.Router) {
			subRouter.Use(
				middleware.PathParameterMiddleware("projectId", "applicationId"),
			)
			subRouter.Use(
				middleware.AuthorizationMiddleware(
					middleware.MethodPermissionMap{
						http.MethodGet: allPermissions,
					},
				),
			)
			subRouter.Get("/", handleRetrievePromptTestRecords)
		})
		router.Route(PromptTestRecordDetailEndpoint, func(subRouter chi.Router) {
			subRouter.Use(
				middleware.PathParameterMiddleware(
					"projectId",
					"applicationId",
					"promptTestRecordId",
				),
			)
			subRouter.Use(
				middleware.AuthorizationMiddleware(
					middleware.MethodPermissionMap{
						http.MethodGet:    allPermissions,
						http.MethodDelete: adminOnly,
					},
				),
			)
			subRouter.Get("/", handleRetrievePromptTestRecord)
			subRouter.Delete("/", handleDeletePromptTestRecord)
		})
		router.Route(SupportRequestEndpoint, func(subRouter chi.Router) {
			subRouter.Post("/", handleSupportEmailRequest)
		})
		router.Route(UserAccountDetailEndpoint, func(subRouter chi.Router) {
			subRouter.Delete("/", handleDeleteUserAccount)
		})
	})
}

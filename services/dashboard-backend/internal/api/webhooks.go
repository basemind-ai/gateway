package api

import (
	"fmt"
	"github.com/basemind-ai/monorepo/shared/go/apierror"
	"github.com/basemind-ai/monorepo/shared/go/config"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/db/models"
	"github.com/basemind-ai/monorepo/shared/go/exc"
	"github.com/basemind-ai/monorepo/shared/go/urlutils"
	"net/http"
)

func parsePermissionType(permission string) models.AccessPermissionType {
	switch permission {
	case "MEMBER":
		return models.AccessPermissionTypeMEMBER
	case "ADMIN":
		return models.AccessPermissionTypeADMIN
	default:
		return ""
	}
}

func handleUserInvitationWebhook(w http.ResponseWriter, r *http.Request) {
	// the signer verify method expects a full url, including the schema.
	url := fmt.Sprintf("%s%s", r.Host, r.URL.String())
	if err := urlutils.VerifyURL(r.Context(), url); err != nil {
		apierror.Forbidden("invalid invitation url").Render(w)
		return
	}

	projectID, parseErr := db.StringToUUID(r.URL.Query().Get("projectId"))
	if parseErr != nil {
		apierror.BadRequest("invalid project id").Render(w)
		return
	}

	email := r.URL.Query().Get("email")
	if email == "" {
		apierror.BadRequest("invalid email").Render(w)
		return
	}

	permission := parsePermissionType(r.URL.Query().Get("permission"))
	if permission == "" {
		apierror.BadRequest("invalid permission").Render(w)
		return
	}

	project, projectRetrievalErr := db.GetQueries().RetrieveProject(r.Context(), *projectID)
	if projectRetrievalErr != nil {
		apierror.BadRequest("project does not exist or is deleted").Render(w)
		return
	}

	cfg := config.Get(r.Context())
	// TODO: when we support localisation, we should pass locale as a query param as well.
	redirectURL := fmt.Sprintf("%s/en/sign-in", cfg.FrontendBaseURL)

	if exc.MustResult(
		db.GetQueries().CheckUserProjectExists(r.Context(), models.CheckUserProjectExistsParams{
			Email:     email,
			ProjectID: project.ID,
		}),
	) {
		http.Redirect(w, r, redirectURL, http.StatusSeeOther)
		return
	}

	tx := exc.MustResult(db.GetOrCreateTx(r.Context()))
	defer db.HandleRollback(r.Context(), tx)

	queries := db.GetQueries().WithTx(tx)

	userAccount, userRetrievalErr := queries.RetrieveUserAccountByEmail(r.Context(), email)
	if userRetrievalErr != nil {
		createdUserAccount := exc.MustResult(
			queries.CreateUserAccount(r.Context(), models.CreateUserAccountParams{
				Email: email,
			}),
		)
		userAccount = createdUserAccount
	}

	exc.MustResult(queries.CreateUserProject(r.Context(), models.CreateUserProjectParams{
		ProjectID:  project.ID,
		UserID:     userAccount.ID,
		Permission: permission,
	}))

	exc.Must(tx.Commit(r.Context()))

	http.Redirect(w, r, redirectURL, http.StatusSeeOther)
}

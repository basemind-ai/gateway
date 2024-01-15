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

func handleUserInvitationWebhook(w http.ResponseWriter, r *http.Request) {
	// the signer verify method expects a full url, including the schema.
	url := fmt.Sprintf("%s%s", r.Host, r.URL.String())
	if err := urlutils.VerifyURL(r.Context(), url); err != nil {
		apierror.Forbidden("invalid invitation url").Render(w)
		return
	}

	invitationID, parseErr := db.StringToUUID(r.URL.Query().Get("invitationId"))
	if parseErr != nil {
		apierror.BadRequest("invalid invitation id").Render(w)
		return
	}

	invitation, retrievalErr := db.GetQueries().
		RetrieveProjectInvitationByID(r.Context(), *invitationID)
	if retrievalErr != nil {
		apierror.BadRequest("invitation does not exist").Render(w)
		return
	}

	cfg := config.Get(r.Context())
	// TODO: when we support localisation, we should pass locale as a query param as well.
	redirectURL := fmt.Sprintf("%s/en/sign-in", cfg.FrontendBaseURL)

	if exc.MustResult(
		db.GetQueries().CheckUserProjectExists(r.Context(), models.CheckUserProjectExistsParams{
			Email:     invitation.Email,
			ProjectID: invitation.ProjectID,
		}),
	) {
		http.Redirect(w, r, redirectURL, http.StatusSeeOther)
		return
	}

	tx := exc.MustResult(db.GetOrCreateTx(r.Context()))
	defer db.HandleRollback(r.Context(), tx)

	queries := db.GetQueries().WithTx(tx)

	userAccount, userRetrievalErr := queries.RetrieveUserAccountByEmail(
		r.Context(),
		invitation.Email,
	)
	if userRetrievalErr != nil {
		createdUserAccount := exc.MustResult(
			queries.CreateUserAccount(r.Context(), models.CreateUserAccountParams{
				Email: invitation.Email,
			}),
		)
		userAccount = createdUserAccount
	}

	exc.MustResult(queries.CreateUserProject(r.Context(), models.CreateUserProjectParams{
		ProjectID:  invitation.ProjectID,
		UserID:     userAccount.ID,
		Permission: invitation.Permission,
	}))
	exc.Must(queries.DeleteProjectInvitation(r.Context(), invitation.ID))
	exc.Must(tx.Commit(r.Context()))

	http.Redirect(w, r, redirectURL, http.StatusSeeOther)
}

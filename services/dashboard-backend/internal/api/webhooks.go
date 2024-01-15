package api

import (
	"fmt"
	"github.com/basemind-ai/monorepo/shared/go/apierror"
	"github.com/basemind-ai/monorepo/shared/go/config"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/db/models"
	"github.com/basemind-ai/monorepo/shared/go/exc"
	"github.com/basemind-ai/monorepo/shared/go/urlutils"
	"github.com/rs/zerolog/log"
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

	cfg := config.Get(r.Context())
	// TODO: when we support localisation, we should pass locale as a query param as well.
	redirectURL := fmt.Sprintf("%s/en/sign-in", cfg.FrontendBaseURL)

	invitation, retrievalErr := db.GetQueries().
		RetrieveProjectInvitationByID(r.Context(), *invitationID)

	if retrievalErr != nil {
		log.Debug().
			Err(retrievalErr).
			Str("redirectURL", redirectURL).
			Msg("failed to retrieve invitation, redirecting to sign in page")
		http.Redirect(w, r, redirectURL, http.StatusPermanentRedirect)
		return
	}

	tx := exc.MustResult(db.GetOrCreateTx(r.Context()))
	defer db.HandleRollback(r.Context(), tx)

	queries := db.GetQueries().WithTx(tx)

	if !exc.MustResult(
		db.GetQueries().CheckUserProjectExists(r.Context(), models.CheckUserProjectExistsParams{
			Email:     invitation.Email,
			ProjectID: invitation.ProjectID,
		}),
	) {
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
	}

	exc.Must(queries.DeleteProjectInvitation(r.Context(), invitation.ID))
	exc.Must(tx.Commit(r.Context()))
	http.Redirect(w, r, redirectURL, http.StatusPermanentRedirect)
	log.Debug().
		Str("redirectURL", redirectURL).
		Str("email", invitation.Email).
		Str("projectId", db.UUIDToString(&invitation.ProjectID)).
		Msg("user invitation handled")
}

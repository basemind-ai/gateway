package api

import (
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/middleware"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/repositories"
	"github.com/basemind-ai/monorepo/shared/go/apierror"
	"github.com/basemind-ai/monorepo/shared/go/db/models"
	"net/http"
)

// handleDeleteUserAccount - hard deletes a user account from our DB and firebase.
func handleDeleteUserAccount(w http.ResponseWriter, r *http.Request) {
	userAccount := r.Context().Value(middleware.UserAccountContextKey).(*models.UserAccount)

	if err := repositories.DeleteUserAccount(r.Context(), *userAccount); err != nil {
		apierror.BadRequest(err.Error()).Render(w)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

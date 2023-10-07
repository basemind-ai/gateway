package api

import (
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/middleware"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/repositories"
	"github.com/basemind-ai/monorepo/shared/go/apierror"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"net/http"
)

// HandleRetrieveUserData is a handler called by the frontend after signup or login.
// because the user is managed by firebase, not our postgres, this function has two code paths-
// 1. user already exists, in which case it retrieves the projects for the user and their respective applications.
// 2. user is new, in which case it creates the user entry and the default project, retrieve this project.
func HandleRetrieveUserData(w http.ResponseWriter, r *http.Request) {
	firebaseID := r.Context().Value(middleware.FireBaseIDContextKey).(string)

	userData, err := repositories.GetOrCreateUserAccount(r.Context(), firebaseID)
	if err != nil {
		apierror.InternalServerError().Render(w, r)
		return
	}

	serialization.RenderJSONResponse(w, http.StatusOK, userData)
}

// HandleUpdateUserDefaultProject - sets the given project as the user's default project.
// the project ID should be passed in the request body and it must (a) belong to a non-deleted project, and
// (b) the user must have access to it.
func HandleUpdateUserDefaultProject(w http.ResponseWriter, r *http.Request) {
	apierror.InternalServerError().Render(w, r)
}

package api

import (
	"github.com/basemind-ai/monorepo/shared/go/apierror"
	"net/http"
)

// HandleAddUserToProject - adds a user to a project with the specified permission level
// requires ADMIN permission, otherwise responds with status 403 FORBIDDEN.
func HandleAddUserToProject(w http.ResponseWriter, r *http.Request) {
	apierror.InternalServerError().Render(w, r)
}

// HandleChangeUserProjectPermission - changes the user's permission to the one specified
// requires ADMIN permission, otherwise responds with status 403 FORBIDDEN.
func HandleChangeUserProjectPermission(w http.ResponseWriter, r *http.Request) {
	apierror.InternalServerError().Render(w, r)
}

// HandleRemoveUserFromProject - removes a user from a project
// requires ADMIN permission, otherwise responds with status 403 FORBIDDEN.
func HandleRemoveUserFromProject(w http.ResponseWriter, r *http.Request) {
	apierror.InternalServerError().Render(w, r)
}

package api

import (
	"github.com/basemind-ai/monorepo/shared/go/apierror"
	"net/http"
)

// HandleAddUserToProject - adds a user to a project with the specified permission level
func HandleAddUserToProject(w http.ResponseWriter, r *http.Request) {
	apierror.InternalServerError().Render(w, r)
}

// HandleChangeUserProjectPermission - changes the user's permission to the one specified
func HandleChangeUserProjectPermission(w http.ResponseWriter, r *http.Request) {
	apierror.InternalServerError().Render(w, r)
}

// HandleRemoveUserFromProject - removes a user from a project
func HandleRemoveUserFromProject(w http.ResponseWriter, r *http.Request) {
	apierror.InternalServerError().Render(w, r)
}

package api

import (
	"github.com/basemind-ai/monorepo/shared/go/apierror"
	"net/http"
)

// HandleRetrieveProjectUsers - retrieves all users for a project.
func HandleRetrieveProjectUsers(w http.ResponseWriter, r *http.Request) {
	apierror.InternalServerError().Render(w, r)
}

// HandleAddUserToProject - adds a user to a project with the specified permission level.
func HandleAddUserToProject(w http.ResponseWriter, r *http.Request) {
	apierror.InternalServerError().Render(w, r)
}

// HandleChangeUserProjectPermission - changes the user's permission to the one specified.
func HandleChangeUserProjectPermission(w http.ResponseWriter, r *http.Request) {
	apierror.InternalServerError().Render(w, r)
}

// HandleRemoveUserFromProject - removes a user from a project.
func HandleRemoveUserFromProject(w http.ResponseWriter, r *http.Request) {
	apierror.InternalServerError().Render(w, r)
}

package api

import (
	"github.com/basemind-ai/monorepo/shared/go/apierror"
	"net/http"
)

// HandleCreateProject - creates a new project and sets the user as an ADMIN.
func HandleCreateProject(w http.ResponseWriter, r *http.Request) {
	apierror.InternalServerError().Render(w, r)
}

// HandleUpdateProject - allows updating the name and description of a project
// requires ADMIN permission, otherwise responds with status 403 FORBIDDEN.
func HandleUpdateProject(w http.ResponseWriter, r *http.Request) {
	apierror.InternalServerError().Render(w, r)
}

// HandleDeleteProject - deletes a project and all associated applications by setting the deleted_at timestamp on these
// requires ADMIN permission, otherwise responds with status 403 FORBIDDEN.
func HandleDeleteProject(w http.ResponseWriter, r *http.Request) {
	apierror.InternalServerError().Render(w, r)
}

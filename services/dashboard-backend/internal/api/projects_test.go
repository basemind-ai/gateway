package api_test

import (
	"fmt"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/api"
	"testing"
)

func TestProjectsAPI(t *testing.T) {
	t.Run(fmt.Sprintf("POST: %s", api.ProjectsListEndpoint), func(t *testing.T) {
		t.Run("creates a new project and set the user as ADMIN", func(t *testing.T) {})
		t.Run(
			"responds with status 400 BAD REQUEST if the request body is invalid",
			func(t *testing.T) {},
		)
	})
	t.Run(fmt.Sprintf("PATCH: %s", api.ProjectDetailEndpoint), func(t *testing.T) {
		t.Run("allows updating the name and description of a project", func(t *testing.T) {})
		t.Run(
			"requires ADMIN permission, otherwise responds with status 403 FORBIDDEN",
			func(t *testing.T) {},
		)
		t.Run(
			"responds with status 400 BAD REQUEST if the request body is invalid",
			func(t *testing.T) {},
		)
		t.Run(
			"responds with status 404 NOT FOUND if the projectId is invalid",
			func(t *testing.T) {},
		)
	})
	t.Run(fmt.Sprintf("DELETE: %s", api.ProjectDetailEndpoint), func(t *testing.T) {
		t.Run(
			"deletes a project and all associated applications by setting the deleted_at timestamp on these",
			func(t *testing.T) {},
		)
		t.Run(
			"requires ADMIN permission, otherwise responds with status 403 FORBIDDEN",
			func(t *testing.T) {},
		)
		t.Run(
			"responds with status 404 NOT FOUND if the projectId is invalid",
			func(t *testing.T) {},
		)
	})
}

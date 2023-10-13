package api_test

import (
	"fmt"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/api"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"testing"
)

func TestProjectUsersAPI(t *testing.T) {
	t.Run(fmt.Sprintf("GET: %s", api.ProjectsListEndpoint), func(t *testing.T) {
		for _, permission := range []db.AccessPermissionType{
			db.AccessPermissionTypeMEMBER, db.AccessPermissionTypeADMIN,
		} {
			t.Run(
				fmt.Sprintf(
					"responds with status 201 CREATED if the user has %s permission",
					permission,
				),
				func(t *testing.T) {},
			)
		}

		t.Run(
			"responds with status 403 FORBIDDEN if the user does not have projects access",
			func(t *testing.T) {},
		)
	})

	t.Run(fmt.Sprintf("POST: %s", api.ProjectUserDetailEndpoint), func(t *testing.T) {
		t.Run(
			"responds with status 401 UNAUTHORIZED if the user does not have ADMIN permission",
			func(t *testing.T) {},
		)
		t.Run(
			"responds with status 403 FORBIDDEN if the user does not have projects access",
			func(t *testing.T) {},
		)
	})

	t.Run(fmt.Sprintf("PATCH: %s", api.ProjectUserDetailEndpoint), func(t *testing.T) {
		t.Run(
			"responds with status 401 UNAUTHORIZED if the user does not have ADMIN permission",
			func(t *testing.T) {},
		)
		t.Run(
			"responds with status 403 FORBIDDEN if the user does not have projects access",
			func(t *testing.T) {},
		)
	})

	t.Run(fmt.Sprintf("DELETE: %s", api.ProjectUserDetailEndpoint), func(t *testing.T) {
		t.Run(
			"responds with status 401 UNAUTHORIZED if the user does not have ADMIN permission",
			func(t *testing.T) {},
		)
		t.Run(
			"responds with status 403 FORBIDDEN if the user does not have projects access",
			func(t *testing.T) {},
		)
	})
}

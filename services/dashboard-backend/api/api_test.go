package api_test

import (
	"context"
	"fmt"
	db2 "github.com/basemind-ai/monorepo/shared/go/db"
	dbTestUtils "github.com/basemind-ai/monorepo/shared/go/db/testutils"
	firebaseTestUtils "github.com/basemind-ai/monorepo/shared/go/firebaseutils/testutils"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/jackc/pgx/v5/pgtype"

	"github.com/basemind-ai/monorepo/services/dashboard-backend/api"

	"github.com/basemind-ai/monorepo/services/dashboard-backend/constants"
	"github.com/stretchr/testify/assert"
)

func deleteUserData(ctx context.Context, dbQueries *db2.Queries, userID pgtype.UUID) {
	userProjects, _ := dbQueries.FindProjectsByUserId(ctx, userID)
	for _, project := range userProjects {
		_ = dbQueries.DeleteUserProject(ctx, project.ID)
		_ = dbQueries.DeleteProject(ctx, project.ID)
	}

	_ = dbQueries.DeleteUser(ctx, fmt.Sprintf("%x", userID.Bytes))
}

func TestHandleDashboardUserPostLogin(t *testing.T) {
	dbTestUtils.CreateTestDB(t)

	t.Run("Create New User tests", func(t *testing.T) {
		t.Run("success case", func(t *testing.T) {
			rr := httptest.NewRecorder()

			req, err := http.NewRequestWithContext(firebaseTestUtils.MockFirebaseContext(), http.MethodGet, constants.DashboardLoginEndpoint, nil)
			assert.Nil(t, err)

			api.HandleDashboardUserPostLogin(rr, req)
			res := rr.Result()

			assert.Equal(t, http.StatusCreated, res.StatusCode)

			var responseUser api.HandleDashboardUserPostLoginDTO
			err = serialization.DeserializeJson(res, &responseUser)

			assert.Nil(t, err)
			assert.Equal(t, "1", responseUser.User.FirebaseID)
			assert.Equal(t, "Default Project", responseUser.Projects[0].Name)
			assert.Equal(t, "Default Project", responseUser.Projects[0].Description)
		})
	})

	t.Run("Retrieves a existing user tests", func(t *testing.T) {
		t.Run("success case", func(t *testing.T) {
			req, err := http.NewRequestWithContext(firebaseTestUtils.MockFirebaseContext(), http.MethodGet, constants.DashboardLoginEndpoint, nil)
			assert.Nil(t, err)
			api.HandleDashboardUserPostLogin(httptest.NewRecorder(), req)

			req, err = http.NewRequestWithContext(firebaseTestUtils.MockFirebaseContext(), http.MethodGet, constants.DashboardLoginEndpoint, nil)
			assert.Nil(t, err)

			rr := httptest.NewRecorder()
			api.HandleDashboardUserPostLogin(rr, req)

			res := rr.Result()
			assert.Equal(t, http.StatusOK, res.StatusCode)

			var responseUser api.HandleDashboardUserPostLoginDTO
			err = serialization.DeserializeJson(res, &responseUser)

			assert.Nil(t, err)
			assert.Equal(t, "1", responseUser.User.FirebaseID)
			assert.Equal(t, "Default Project", responseUser.Projects[0].Name)
			assert.Equal(t, "Default Project", responseUser.Projects[0].Description)
		})

		t.Run("failure case - failed to retrieve user projects", func(t *testing.T) {
			ctx := context.TODO()
			dbQueries := db2.GetQueries()

			existingUser, err := dbQueries.FindUserByFirebaseId(ctx, "1")
			if err == nil {
				deleteUserData(ctx, dbQueries, existingUser.ID)
			}

			// Create a user but not his projects
			_, _ = dbQueries.CreateUser(ctx, "1")

			req, err := http.NewRequestWithContext(firebaseTestUtils.MockFirebaseContext(), http.MethodGet, constants.DashboardLoginEndpoint, nil)
			assert.Nil(t, err)

			rr := httptest.NewRecorder()
			api.HandleDashboardUserPostLogin(rr, req)

			res := rr.Result()
			assert.Equal(t, http.StatusInternalServerError, res.StatusCode)
		})
	})
}

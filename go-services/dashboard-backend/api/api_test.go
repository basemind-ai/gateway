package api

import (
	"encoding/json"
	"github.com/basemind-ai/monorepo/go-services/dashboard-backend/constants"
	dbTestutils "github.com/basemind-ai/monorepo/go-shared/db/testutils"
	"github.com/basemind-ai/monorepo/go-shared/firebaseutils/testutils"
	"github.com/stretchr/testify/assert"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestMain(m *testing.M) {
	dbTestutils.TestMainWrapper(m)
}

func TestHandleDashboardUserPostLogin(t *testing.T) {

	t.Run("Creates a new user", func(t *testing.T) {
		rr := httptest.NewRecorder()

		req, err := http.NewRequestWithContext(testutils.MockFirebaseContext(), http.MethodGet, constants.DashboardLoginEndpoint, nil)
		assert.Nil(t, err)

		HandleDashboardUserPostLogin(rr, req)

		res := rr.Result()
		assert.Equal(t, http.StatusCreated, res.StatusCode)

		defer res.Body.Close()
		body, err := io.ReadAll(res.Body)
		assert.Nil(t, err)

		var responseUser HandleDashboardUserPostLoginDTO
		_ = json.Unmarshal(body, &responseUser)

		assert.Equal(t, "1", responseUser.User.FirebaseID)
		assert.Equal(t, "Default Project", responseUser.Projects[0].Name)
		assert.Equal(t, "Default Project", responseUser.Projects[0].Description)
	})

	t.Run("Retrieves an existing user", func(t *testing.T) {
		// Create a new user first
		req, err := http.NewRequestWithContext(testutils.MockFirebaseContext(), http.MethodGet, constants.DashboardLoginEndpoint, nil)
		assert.Nil(t, err)
		HandleDashboardUserPostLogin(httptest.NewRecorder(), req)

		req, err = http.NewRequestWithContext(testutils.MockFirebaseContext(), http.MethodGet, constants.DashboardLoginEndpoint, nil)
		assert.Nil(t, err)

		rr := httptest.NewRecorder()
		HandleDashboardUserPostLogin(rr, req)

		res := rr.Result()
		assert.Equal(t, http.StatusOK, res.StatusCode)

		defer res.Body.Close()
		body, err := io.ReadAll(res.Body)
		assert.Nil(t, err)

		var responseUser HandleDashboardUserPostLoginDTO
		_ = json.Unmarshal(body, &responseUser)

		assert.Equal(t, "1", responseUser.User.FirebaseID)
		assert.Equal(t, "Default Project", responseUser.Projects[0].Name)
		assert.Equal(t, "Default Project", responseUser.Projects[0].Description)
	})
}

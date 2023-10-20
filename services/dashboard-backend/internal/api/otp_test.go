package api_test

import (
	"context"
	"fmt"
	"github.com/basemind-ai/monorepo/e2e/factories"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/api"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/dto"
	"github.com/basemind-ai/monorepo/shared/go/config"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/jwtutils"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"github.com/basemind-ai/monorepo/shared/go/testutils"
	"github.com/stretchr/testify/assert"
	"net/http"
	"strings"
	"testing"
	"time"
)

func TestOTPAPI(t *testing.T) {
	testutils.SetTestEnv(t)

	userAccount, _ := factories.CreateUserAccount(context.TODO())
	projectID := createProject(t)
	createUserProject(t, userAccount.FirebaseID, projectID, db.AccessPermissionTypeADMIN)

	testClient := createTestClient(t, userAccount)

	url := fmt.Sprintf(
		"/v1%s",
		strings.ReplaceAll(api.ProjectOTPEndpoint, "{projectId}", projectID),
	)

	t.Run("should get an OTP", func(t *testing.T) {
		response, requestErr := testClient.Get(
			context.TODO(),
			url,
		)
		assert.NoError(t, requestErr)
		assert.Equal(t, http.StatusOK, response.StatusCode)

		body := dto.OtpDTO{}
		deserializationErr := serialization.DeserializeJSON(response.Body, &body)
		assert.NoError(t, deserializationErr)
		assert.NotEmpty(t, body.OTP)

		cfg, err := config.Get(context.TODO())
		assert.NoError(t, err)

		claims, parseErr := jwtutils.ParseJWT(body.OTP, []byte(cfg.JWTSecret))
		assert.NoError(t, parseErr)

		sub, subErr := claims.GetSubject()
		assert.NoError(t, subErr)
		assert.Equal(t, userAccount.FirebaseID, sub)

		exp, expErr := claims.GetExpirationTime()
		assert.NoError(t, expErr)
		assert.LessOrEqual(t, time.Now().Add(time.Minute).Unix(), exp.Unix())
	})

	t.Run(
		"responds with status 403 FORBIDDEN if the user does not have projects access",
		func(t *testing.T) {
			newProject, _ := factories.CreateProject(context.Background())
			response, requestErr := testClient.Get(
				context.TODO(),
				fmt.Sprintf(
					"/v1%s",
					strings.ReplaceAll(
						api.ProjectOTPEndpoint,
						"{projectId}",
						db.UUIDToString(&newProject.ID),
					),
				),
			)
			assert.NoError(t, requestErr)
			assert.Equal(t, http.StatusForbidden, response.StatusCode)
		},
	)
}

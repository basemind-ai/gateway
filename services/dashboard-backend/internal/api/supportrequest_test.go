package api_test

import (
	"cloud.google.com/go/pubsub"
	"context"
	"fmt"
	"github.com/basemind-ai/monorepo/e2e/factories"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/api"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/dto"
	"github.com/basemind-ai/monorepo/shared/go/config"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/pubsubutils"
	"github.com/basemind-ai/monorepo/shared/go/testutils"
	"github.com/stretchr/testify/assert"
	"net/http"
	"testing"
	"time"
)

func TestSupportAPI(t *testing.T) {
	testutils.SetTestEnv(t)
	userAccount, _ := factories.CreateUserAccount(context.TODO())
	project, _ := factories.CreateProject(context.TODO())

	testClient := createTestClient(t, userAccount)

	t.Run("CreateSupportRequest", func(t *testing.T) {
		t.Run("creates a support request", func(t *testing.T) {
			cfg := config.Get(context.TODO())
			testutils.CreatePubsubTestContainer(t, map[string]string{
				"PUBSUB_PROJECT1": fmt.Sprintf(
					"%s,%s:test-subscription",
					cfg.GcpProjectID,
					pubsubutils.EmailSenderPubSubTopicID,
				),
			})

			pubSubClient := pubsubutils.GetClient(context.TODO())
			subscription := pubSubClient.Subscription("test-subscription")
			assert.NotNil(t, subscription)

			// we have to wait because the subscription takes time to be created.
			time.Sleep(3 * time.Second)

			exists, existsErr := subscription.Exists(context.Background())
			assert.NoError(t, existsErr)
			assert.True(t, exists)

			msgChannel := make(chan *pubsub.Message)

			go func() {
				ctx, cancel := context.WithTimeout(context.TODO(), 20*time.Second)
				defer cancel()

				subErr := subscription.Receive(ctx, func(_ context.Context, msg *pubsub.Message) {
					msg.Ack()
					assert.NotNil(t, msg)
					msgChannel <- msg
				})

				assert.NoError(t, subErr)
			}()

			supportRequestBody := dto.SupportRequestDTO{
				RequestTopic: "token",
				EmailSubject: "token problems",
				EmailBody:    "token doesnt verify....",
				ProjectID:    db.UUIDToString(&project.ID),
			}
			response, requestErr := testClient.Post(
				context.TODO(),
				fmt.Sprintf("/v1%s", api.SupportRequestEndpoint),
				supportRequestBody)

			assert.NoError(t, requestErr)
			assert.Equal(t, response.StatusCode, http.StatusCreated)

			msg := <-msgChannel
			assert.NotNil(t, msg)
		})

		t.Run("responds with 400 BAD REQUEST if request body is invalid", func(t *testing.T) {
			response, requestErr := testClient.Post(
				context.TODO(),
				fmt.Sprintf("/v1%s", api.SupportRequestEndpoint),
				"invalid request body")

			assert.NoError(t, requestErr)
			assert.Equal(t, response.StatusCode, http.StatusBadRequest)
		})

		t.Run(
			"responds with 400 BAD REQUEST if request body is missing required fields",
			func(t *testing.T) {
				supportRequestBody := dto.SupportRequestDTO{}
				response, requestErr := testClient.Post(
					context.TODO(),
					fmt.Sprintf("/v1%s", api.SupportRequestEndpoint),
					supportRequestBody)

				assert.NoError(t, requestErr)
				assert.Equal(t, response.StatusCode, http.StatusBadRequest)
			},
		)
	})
}

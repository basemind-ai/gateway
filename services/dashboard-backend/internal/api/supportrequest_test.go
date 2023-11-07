package api_test

import (
	"context"
	"fmt"
	"github.com/basemind-ai/monorepo/e2e/factories"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/api"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/dto"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/testutils"
	"github.com/stretchr/testify/assert"
	"net/http"
	"testing"
)

func TestSupportAPI(t *testing.T) {
	testutils.SetTestEnv(t)
	userAccount, _ := factories.CreateUserAccount(context.TODO())
	project, _ := factories.CreateProject(context.TODO())

	testClient := createTestClient(t, userAccount)

	t.Run("CreateSupportRequest", func(t *testing.T) {
		t.Run("creates a support request", func(t *testing.T) {
			// topic := pubsubutils.GetTopic(context.TODO(), pubsubutils.EmailSenderPubSubTopicID)
			// subscription := pubsubutils.GetSubscription(context.TODO(), "test-subscription", topic)
			//
			// msgChannel := make(chan *pubsub.Message)
			//
			// go func() {
			//	ctx, cancel := context.WithTimeout(context.TODO(), 1*time.Minute)
			//	defer cancel()
			//
			//	exc.LogIfErr(subscription.Receive(ctx, func(_ context.Context, msg *pubsub.Message) {
			//		msg.Ack()
			//		assert.NotNil(t, msg)
			//		msgChannel <- msg
			//		close(msgChannel)
			//		return
			//	}))
			//
			//	return
			// }()

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

			// msg := <-msgChannel
			// assert.NotNil(t, msg)

			// emailSenderData := emailsender.SendEmailRequestDTO{}
			// _ = json.Unmarshal(msg.Data, &emailSenderData)
			//
			// assert.Equal(t, emailSenderData.FromName, userAccount.DisplayName)
			// assert.Equal(t, emailSenderData.FromAddress, userAccount.Email)
			// assert.Equal(t, emailSenderData.ToName, "Basemind Support")
			//assert.Equal(t, emailSenderData.ToAddress, api.SupportEmailAddress)
			//assert.Equal(t, emailSenderData.TemplateID, api.SupportEmailTemplateID)
			//assert.Equal(t, emailSenderData.TemplateVariables["body"], supportRequestBody.EmailBody)
			//assert.Equal(t, emailSenderData.TemplateVariables["email"], userAccount.Email)
			//assert.Equal(t, emailSenderData.TemplateVariables["fullName"], userAccount.DisplayName)
			//assert.Equal(
			//	t,
			//	emailSenderData.TemplateVariables["projectId"],
			//	supportRequestBody.ProjectID,
			//)
			//assert.Equal(
			//	t,
			//	emailSenderData.TemplateVariables["subject"],
			//	supportRequestBody.EmailSubject,
			//)
			//assert.Equal(
			//	t,
			//	emailSenderData.TemplateVariables["topic"],
			//	supportRequestBody.RequestTopic,
			//)
			//assert.Equal(
			//	t,
			//	emailSenderData.TemplateVariables["userId"],
			//	db.UUIDToString(&userAccount.ID),
			//)
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

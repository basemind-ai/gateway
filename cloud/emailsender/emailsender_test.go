package emailsender_test

import (
	"context"
	"encoding/json"
	"github.com/basemind-ai/monorepo/cloud/emailsender"
	"github.com/basemind-ai/monorepo/cloud/shared"
	"github.com/basemind-ai/monorepo/shared/go/datatypes"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"github.com/basemind-ai/monorepo/shared/go/testutils"
	"github.com/cloudevents/sdk-go/v2/event"
	"github.com/stretchr/testify/assert"
	"net/http"
	"testing"
)

func TestEmailSender(t *testing.T) {
	t.Setenv("SENDGRID_API_KEY", "SG.1234567890")

	emailRequest := datatypes.SendEmailRequestDTO{
		FromName:    "Moishe Zuchmir",
		FromAddress: "zuchmir@basemind.ai",
		ToName:      "Claude Unknown",
		ToAddress:   "clause@example.com",
		TemplateID:  "d-c6dcf1f72bdd4beeb15a9aa6c72fcd2c",
		TemplateVariables: map[string]string{
			"firstName": "Claude",
			"lastName":  "Unknown",
		},
	}

	t.Run("CreateSendgridEmail", func(t *testing.T) {
		t.Run("should return a sendgrid email object", func(t *testing.T) {
			email := emailsender.CreateSendgridEmail(&emailRequest)
			assert.Equal(t, emailRequest.FromName, email.From.Name)
			assert.Equal(t, emailRequest.FromAddress, email.From.Address)
			assert.Equal(t, emailRequest.TemplateID, email.TemplateID)
			assert.Equal(t, emailRequest.ToName, email.Personalizations[0].To[0].Name)
			assert.Equal(t, emailRequest.ToAddress, email.Personalizations[0].To[0].Address)
			assert.Equal(
				t,
				emailRequest.TemplateVariables["firstName"],
				email.Personalizations[0].DynamicTemplateData["firstName"],
			)
			assert.Equal(
				t,
				emailRequest.TemplateVariables["lastName"],
				email.Personalizations[0].DynamicTemplateData["lastName"],
			)
		})
	})
	t.Run("CreateSendgridRequest", func(t *testing.T) {
		t.Run("should return a sendgrid request object", func(t *testing.T) {
			request := emailsender.CreateSendgridRequest(&emailRequest)
			assert.Equal(t, "https://api.sendgrid.com/v3/mail/send", request.BaseURL)
			assert.Equal(t, "POST", string(request.Method))

			body := make(map[string]interface{})
			err := json.Unmarshal(request.Body, &body)
			assert.NoError(t, err)

			assert.Equal(t, emailRequest.FromName, body["from"].(map[string]interface{})["name"])
			assert.Equal(
				t,
				emailRequest.FromAddress,
				body["from"].(map[string]interface{})["email"],
			)
			assert.Equal(t, emailRequest.TemplateID, body["template_id"])

			personalizations := body["personalizations"].([]interface{})
			assert.Equal(
				t,
				emailRequest.ToName,
				personalizations[0].(map[string]interface{})["to"].([]interface{})[0].(map[string]interface{})["name"],
			)
			assert.Equal(
				t,
				emailRequest.ToAddress,
				personalizations[0].(map[string]interface{})["to"].([]interface{})[0].(map[string]interface{})["email"],
			)
			assert.Equal(
				t,
				emailRequest.TemplateVariables["firstName"],
				personalizations[0].(map[string]interface{})["dynamic_template_data"].(map[string]interface{})["firstName"],
			)
			assert.Equal(
				t,
				emailRequest.TemplateVariables["lastName"],
				personalizations[0].(map[string]interface{})["dynamic_template_data"].(map[string]interface{})["lastName"],
			)
		})
	})

	t.Run("ParseEmailRequestDTO", func(t *testing.T) {
		t.Run("should return a sendgrid email object", func(t *testing.T) {
			data, _ := json.Marshal(emailRequest)

			pubsubMessage := shared.PubSubMessage{
				Data: data,
			}

			cloudEvent := event.New()
			err := cloudEvent.SetData("application/json", shared.MessagePublishedData{
				Message: pubsubMessage,
			})
			assert.NoError(t, err)

			emailRequest, err := emailsender.ParseEmailRequestDTO(cloudEvent)
			assert.NoError(t, err)
			assert.Equal(t, emailRequest.FromName, emailRequest.FromName)
			assert.Equal(t, emailRequest.FromAddress, emailRequest.FromAddress)
			assert.Equal(t, emailRequest.TemplateID, emailRequest.TemplateID)
			assert.Equal(t, emailRequest.ToName, emailRequest.ToName)
			assert.Equal(t, emailRequest.ToAddress, emailRequest.ToAddress)
			assert.Equal(
				t,
				emailRequest.TemplateVariables["firstName"],
				emailRequest.TemplateVariables["firstName"],
			)
			assert.Equal(
				t,
				emailRequest.TemplateVariables["lastName"],
				emailRequest.TemplateVariables["lastName"],
			)
		})

		t.Run("should return an error if the event is does not have any data", func(t *testing.T) {
			_, err := emailsender.ParseEmailRequestDTO(event.New())
			assert.Error(t, err)
		})

		t.Run("should return an error if the event data is invalid json", func(t *testing.T) {
			cloudEvent := event.New()
			eventErr := cloudEvent.SetData("application/json", shared.MessagePublishedData{
				Message: shared.PubSubMessage{
					Data: []byte("invalid json"),
				},
			})
			assert.NoError(t, eventErr)
			_, err := emailsender.ParseEmailRequestDTO(cloudEvent)
			assert.Error(t, err)
		})
	})

	t.Run("SendgridPubSubHandler", func(t *testing.T) {
		t.Run("it sends an email via the sendgrid API", func(t *testing.T) {
			var (
				method string
				body   []byte
				url    string
			)

			testClient := testutils.CreateTestHTTPClient(
				t,
				http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					body, _ = serialization.ReadBody(r.Body)
					url = r.URL.String()
					method = r.Method
					serialization.RenderJSONResponse(w, http.StatusOK, map[string]string{})
				}),
			)

			t.Setenv("SENDGRID_HOST", testClient.BaseURL)

			data, _ := json.Marshal(emailRequest)

			pubsubMessage := shared.PubSubMessage{
				Data: data,
			}

			cloudEvent := event.New()
			cloudEventCreateErr := cloudEvent.SetData(
				"application/json",
				shared.MessagePublishedData{
					Message: pubsubMessage,
				},
			)
			assert.NoError(t, cloudEventCreateErr)

			err := emailsender.SendgridPubSubHandler(context.TODO(), cloudEvent)
			assert.NoError(t, err)

			assert.Equal(t, http.MethodPost, method)

			assert.Equal(t, "/v3/mail/send", url)
			assert.NotNil(t, body)
		})

		t.Run("it handles a parse error", func(t *testing.T) {
			cloudEvent := event.New()
			cloudEventCreateErr := cloudEvent.SetData(
				"application/json",
				shared.MessagePublishedData{
					Message: shared.PubSubMessage{
						Data: []byte("invalid json"),
					},
				},
			)
			assert.NoError(t, cloudEventCreateErr)

			err := emailsender.SendgridPubSubHandler(context.Background(), cloudEvent)
			assert.Error(t, err)
		})

		t.Run(
			"it returns an error if the sendgrid API returns an error response",
			func(t *testing.T) {
				testClient := testutils.CreateTestHTTPClient(
					t,
					http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
						serialization.RenderJSONResponse(
							w,
							http.StatusBadRequest,
							map[string]string{},
						)
					}),
				)

				t.Setenv("SENDGRID_HOST", testClient.BaseURL)

				data, _ := json.Marshal(emailRequest)

				pubsubMessage := shared.PubSubMessage{
					Data: data,
				}

				cloudEvent := event.New()
				cloudEventCreateErr := cloudEvent.SetData(
					"application/json",
					shared.MessagePublishedData{
						Message: pubsubMessage,
					},
				)
				assert.NoError(t, cloudEventCreateErr)

				err := emailsender.SendgridPubSubHandler(context.TODO(), cloudEvent)
				assert.Error(t, err)
			},
		)
	})
}

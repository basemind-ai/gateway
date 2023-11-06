package emailsender_test

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/basemind-ai/monorepo/cloud-functions/emailsender"
	"github.com/cloudevents/sdk-go/v2/event"
	"github.com/stretchr/testify/assert"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
)

func ReadBody(body io.ReadCloser) ([]byte, error) {
	defer func() {
		_, _ = body.Close(), "error closing body"
	}()

	data, readErr := io.ReadAll(body)
	if readErr != nil {
		return nil, fmt.Errorf("failed to read body: %w", readErr)
	}

	return data, nil
}

func RenderJSONResponse(w http.ResponseWriter, statusCode int, body any) {
	w.WriteHeader(statusCode)
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(body)
}

func createTestServer(t *testing.T, handler http.Handler) string {
	t.Helper()
	server := httptest.NewServer(handler)

	t.Cleanup(func() {
		server.Close()
	})

	return server.URL
}

func TestEmailSender(t *testing.T) {
	t.Setenv("SENDGRID_API_KEY", "SG.1234567890")

	emailRequest := emailsender.SendEmailRequestDTO{
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

			body := make(map[string]any)
			err := json.Unmarshal(request.Body, &body)
			assert.NoError(t, err)

			assert.Equal(t, emailRequest.FromName, body["from"].(map[string]any)["name"])
			assert.Equal(
				t,
				emailRequest.FromAddress,
				body["from"].(map[string]any)["email"],
			)
			assert.Equal(t, emailRequest.TemplateID, body["template_id"])

			personalizations := body["personalizations"].([]any)
			assert.Equal(
				t,
				emailRequest.ToName,
				personalizations[0].(map[string]any)["to"].([]any)[0].(map[string]any)["name"],
			)
			assert.Equal(
				t,
				emailRequest.ToAddress,
				personalizations[0].(map[string]any)["to"].([]any)[0].(map[string]any)["email"],
			)
			assert.Equal(
				t,
				emailRequest.TemplateVariables["firstName"],
				personalizations[0].(map[string]any)["dynamic_template_data"].(map[string]any)["firstName"],
			)
			assert.Equal(
				t,
				emailRequest.TemplateVariables["lastName"],
				personalizations[0].(map[string]any)["dynamic_template_data"].(map[string]any)["lastName"],
			)
		})
	})

	t.Run("ParseEmailRequestDTO", func(t *testing.T) {
		t.Run("should return a sendgrid email object", func(t *testing.T) {
			data, _ := json.Marshal(emailRequest)

			pubsubMessage := emailsender.PubSubMessage{
				Data: data,
			}

			cloudEvent := event.New()
			err := cloudEvent.SetData("application/json", emailsender.MessagePublishedData{
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
			eventErr := cloudEvent.SetData("application/json", emailsender.MessagePublishedData{
				Message: emailsender.PubSubMessage{
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

			baseURL := createTestServer(
				t,
				http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					body, _ = ReadBody(r.Body)
					url = r.URL.String()
					method = r.Method
					RenderJSONResponse(w, http.StatusOK, map[string]string{})
				}),
			)

			t.Setenv("SENDGRID_HOST", baseURL)

			data, _ := json.Marshal(emailRequest)

			pubsubMessage := emailsender.PubSubMessage{
				Data: data,
			}

			cloudEvent := event.New()
			cloudEventCreateErr := cloudEvent.SetData(
				"application/json",
				emailsender.MessagePublishedData{
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
				emailsender.MessagePublishedData{
					Message: emailsender.PubSubMessage{
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
				baseURL := createTestServer(
					t,
					http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
						RenderJSONResponse(
							w,
							http.StatusBadRequest,
							map[string]string{},
						)
					}),
				)

				t.Setenv("SENDGRID_HOST", baseURL)

				data, _ := json.Marshal(emailRequest)

				pubsubMessage := emailsender.PubSubMessage{
					Data: data,
				}

				cloudEvent := event.New()
				cloudEventCreateErr := cloudEvent.SetData(
					"application/json",
					emailsender.MessagePublishedData{
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

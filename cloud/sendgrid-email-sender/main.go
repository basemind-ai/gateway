package main

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/GoogleCloudPlatform/functions-framework-go/functions"
	"github.com/basemind-ai/monorepo/cloud/pubsub"
	"github.com/basemind-ai/monorepo/shared/go/datatypes"
	"github.com/basemind-ai/monorepo/shared/go/logging"
	"github.com/cloudevents/sdk-go/v2/event"
	"github.com/rs/zerolog/log"
	"github.com/sendgrid/sendgrid-go"
	"github.com/sendgrid/sendgrid-go/helpers/mail"
	"net/http"
	"os"
)

const EventName = "SendgridEmailPubSub"

func init() {
	functions.CloudEvent(EventName, SendgridPubSubHandler)

	logging.Configure(false)
}

// SendgridPubSubHandler consumes a CloudEvent message and sends an email via the sendgrid API.
func SendgridPubSubHandler(ctx context.Context, e event.Event) error {
	msg, parseMsgErr := pubsub.MessageFromEvent(e)
	if parseMsgErr != nil {
		return parseMsgErr
	}

	emailRequest := datatypes.SendEmailRequestDTO{}
	unmarshalErr := json.Unmarshal(msg.Message.Data, &emailRequest)
	if unmarshalErr != nil {
		return unmarshalErr
	}

	log.Info().Str("templateId", emailRequest.TemplateID).Msg("sending email request to sendgrid")

	mailer := mail.NewV3Mail()
	mailer.SetFrom(mail.NewEmail(emailRequest.FromName, emailRequest.FromAddress))
	mailer.SetTemplateID(emailRequest.TemplateID)

	personalization := mail.NewPersonalization()
	personalization.AddTos(mail.NewEmail(emailRequest.ToName, emailRequest.ToAddress))

	for key, value := range emailRequest.TemplateVariables {
		personalization.SetDynamicTemplateData(key, value)
	}

	mailer.AddPersonalizations(personalization)

	request := sendgrid.GetRequest(
		os.Getenv("SENDGRID_API_KEY"),
		"/v3/mail/send",
		"https://api.sendgrid.com",
	)
	request.Method = http.MethodPost
	request.Body = mail.GetRequestBody(mailer)
	response, requestErr := sendgrid.MakeRequestRetryWithContext(ctx, request)

	if requestErr != nil {
		log.Error().Err(requestErr).Msg("error sending email via sendgrid")
		return requestErr
	}

	if response.StatusCode >= http.StatusBadRequest {
		log.Error().Interface("response", response).Msg("received failure status from sendgrid")
		return fmt.Errorf("received failure status from sendgrid: %v", response.StatusCode)
	}

	log.Info().Msg("email sending successful")
	return nil
}

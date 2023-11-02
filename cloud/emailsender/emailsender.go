package emailsender

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/GoogleCloudPlatform/functions-framework-go/functions"
	"github.com/basemind-ai/monorepo/cloud/shared"
	"github.com/basemind-ai/monorepo/shared/go/datatypes"
	"github.com/basemind-ai/monorepo/shared/go/exc"
	"github.com/basemind-ai/monorepo/shared/go/logging"
	"github.com/cloudevents/sdk-go/v2/event"
	"github.com/rs/zerolog/log"
	"github.com/sendgrid/rest"
	"github.com/sendgrid/sendgrid-go"
	"github.com/sendgrid/sendgrid-go/helpers/mail"
	"github.com/sethvargo/go-envconfig"
	"net/http"
)

// EventName is the name of the event that this function will process.
const EventName = "SendgridEmailPubSub"

// SendgridConfig - is an env configuration object.
type SendgridConfig struct {
	SendgridAPIKey   string `env:"SENDGRID_API_KEY,required"`
	SendgridHost     string `env:"SENDGRID_HOST,default=https://api.sendgrid.com"`
	SendgridEndpoint string `env:"SENDGRID_ENDPOINT,default=/v3/mail/send"`
}

func init() {
	logging.Configure(false)

	functions.CloudEvent(EventName, SendgridPubSubHandler)
}

// CreateSendgridEmail creates a sendgrid email object using the sendgrid mail library.
// See: https://github.com/sendgrid/sendgrid-go/blob/main/examples/helpers/mail/example.go
func CreateSendgridEmail(emailRequest *datatypes.SendEmailRequestDTO) *mail.SGMailV3 {
	mailer := mail.NewV3Mail()
	mailer.SetFrom(mail.NewEmail(emailRequest.FromName, emailRequest.FromAddress))
	mailer.SetTemplateID(emailRequest.TemplateID)

	personalization := mail.NewPersonalization()
	personalization.AddTos(mail.NewEmail(emailRequest.ToName, emailRequest.ToAddress))

	for key, value := range emailRequest.TemplateVariables {
		personalization.SetDynamicTemplateData(key, value)
	}

	mailer.AddPersonalizations(personalization)
	return mailer
}

// CreateSendgridRequest creates a sendgrid HTTP request object.
// See: https://github.com/sendgrid/sendgrid-go/blob/main/use-cases/README.md
func CreateSendgridRequest(emailRequest *datatypes.SendEmailRequestDTO) rest.Request {
	cfg := &SendgridConfig{}
	exc.Must(envconfig.Process(context.Background(), cfg))

	request := sendgrid.GetRequest(
		cfg.SendgridAPIKey,
		cfg.SendgridEndpoint,
		cfg.SendgridHost,
	)
	request.Method = http.MethodPost
	request.Body = mail.GetRequestBody(CreateSendgridEmail(emailRequest))

	return request
}

// ParseEmailRequestDTO parses a CloudEvent message and returns a SendEmailRequestDTO.
func ParseEmailRequestDTO(e event.Event) (*datatypes.SendEmailRequestDTO, error) {
	msg, parseMsgErr := shared.MessageFromEvent(e)
	if parseMsgErr != nil {
		return nil, parseMsgErr
	}

	emailRequest := datatypes.SendEmailRequestDTO{}
	unmarshalErr := json.Unmarshal(msg.Message.Data, &emailRequest)
	if unmarshalErr != nil {
		return nil, unmarshalErr
	}

	return &emailRequest, nil
}

// SendgridPubSubHandler consumes a CloudEvent message and sends an email via the sendgrid API.
// If an error is returned by the handler, pubsub will retry the message.
// If nil is returned, pubsub will regard this as an "ack" and remove the message from the queue.
// This function intentionally processes a single 'to' email at a time. While this is less efficient
// it makes working with sendgrid templates easier.
// Note: We might decide to create a separate handler for marketing emails in the future - since these can be processed
// in bulk.
func SendgridPubSubHandler(ctx context.Context, e event.Event) error {
	emailRequest, parseErr := ParseEmailRequestDTO(e)
	if parseErr != nil {
		log.Error().Err(parseErr).Msg("error parsing email request")
		return parseErr
	}

	request := CreateSendgridRequest(emailRequest)

	log.Info().Str("templateId", emailRequest.TemplateID).Msg("sending request to sendgrid")
	response, requestErr := sendgrid.MakeRequestRetryWithContext(ctx, request)

	if requestErr != nil {
		log.Error().Err(requestErr).Msg("error sending email via sendgrid")
		return requestErr
	}

	if response.StatusCode >= http.StatusBadRequest {
		log.Error().Interface("response", response).Msg("received failure status from sendgrid")
		return fmt.Errorf("received failure status from sendgrid: %v", response.StatusCode)
	}

	log.Info().Int("statusCode", response.StatusCode).Msg("email sending successful")
	return nil
}

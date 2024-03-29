package emailsender

import (
	"fmt"
	"github.com/cloudevents/sdk-go/v2/event"
	"time"
)

// SendEmailRequestDTO is a data type used to send an email via sendgrid.
type SendEmailRequestDTO struct { // skipcq: TCV-001
	FromName          string            `json:"fromName"`
	FromAddress       string            `json:"fromAddress"`
	ToName            string            `json:"toName"`
	ToAddress         string            `json:"toAddress"`
	TemplateID        string            `json:"templateId"`
	TemplateVariables map[string]string `json:"templateVariables"`
}

// MessagePublishedData contains the full Pub/Sub message
// See the documentation for more details:
// https://cloud.google.com/eventarc/docs/cloudevents#pubsub
type MessagePublishedData struct {
	Subscription string        `json:"subscription"`
	Message      PubSubMessage `json:"message"`
}

// PubSubMessage is the payload of a Pub/Sub event.
// See the documentation for more details:
// https://cloud.google.com/pubsub/docs/reference/rest/v1/PubsubMessage
type PubSubMessage struct {
	Attributes  map[string]string `json:"attributes,omitempty"`
	Data        []byte            `json:"data"`
	MessageID   string            `json:"messageId,omitempty"`
	PublishTime time.Time         `json:"publishTime,omitempty"`
	OrderingKey string            `json:"orderingKey,omitempty"`
}

// MessageFromEvent - parses a pub-sub message from the cloud event.
func MessageFromEvent(e event.Event) (*MessagePublishedData, error) {
	msg := &MessagePublishedData{}
	if err := e.DataAs(msg); err != nil {
		return nil, fmt.Errorf("event.DataAs: %w", err)
	}
	return msg, nil
}

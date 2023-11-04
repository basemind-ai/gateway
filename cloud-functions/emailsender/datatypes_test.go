package emailsender_test

import (
	"github.com/basemind-ai/monorepo/cloud-functions/emailsender"
	"github.com/cloudevents/sdk-go/v2/event"
	"github.com/stretchr/testify/assert"
	"testing"
)

func TestSharedUtils(t *testing.T) {
	t.Run("MessageFromEvent", func(t *testing.T) {
		t.Run("should return a pub-sub message", func(t *testing.T) {
			pubsubMessage := emailsender.PubSubMessage{
				Data: []byte("hello world"),
			}

			cloudEvent := event.New()
			cloudEventErr := cloudEvent.SetData(
				"application/json",
				emailsender.MessagePublishedData{
					Message: pubsubMessage,
				},
			)
			assert.NoError(t, cloudEventErr)

			msg, err := emailsender.MessageFromEvent(cloudEvent)
			assert.NoError(t, err)
			assert.Equal(t, pubsubMessage.Data, msg.Message.Data)
		})
	})
}

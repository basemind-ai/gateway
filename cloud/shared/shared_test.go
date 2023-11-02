package shared_test

import (
	"github.com/basemind-ai/monorepo/cloud/shared"
	"github.com/cloudevents/sdk-go/v2/event"
	"github.com/stretchr/testify/assert"
	"testing"
)

func TestSharedUtils(t *testing.T) {
	t.Run("MessageFromEvent", func(t *testing.T) {
		t.Run("should return a pub-sub message", func(t *testing.T) {
			pubsubMessage := shared.PubSubMessage{
				Data: []byte("hello world"),
			}

			cloudEvent := event.New()
			cloudEventErr := cloudEvent.SetData("application/json", shared.MessagePublishedData{
				Message: pubsubMessage,
			})
			assert.NoError(t, cloudEventErr)

			msg, err := shared.MessageFromEvent(cloudEvent)
			assert.NoError(t, err)
			assert.Equal(t, pubsubMessage.Data, msg.Message.Data)
		})
	})
}

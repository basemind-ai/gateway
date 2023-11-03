package pubsubutils_test

import (
	"cloud.google.com/go/pubsub"
	"context"
	"github.com/basemind-ai/monorepo/shared/go/pubsubutils"
	"github.com/basemind-ai/monorepo/shared/go/testutils"
	"github.com/stretchr/testify/assert"
	"testing"
)

func TestPubSubUtils(t *testing.T) {
	testutils.SetTestEnv(t)
	testutils.CreatePubsubTestContainer(t)

	t.Run("GetClient", func(t *testing.T) {
		t.Run("creates and returns client", func(t *testing.T) {
			client := pubsubutils.GetClient(context.TODO())
			assert.NotNil(t, client)
		})
	})

	t.Run("GetTopic", func(t *testing.T) {
		t.Run("returns topic if it exists", func(t *testing.T) {
			createdTopic, err := pubsubutils.GetClient(context.TODO()).
				CreateTopic(context.TODO(), pubsubutils.EmailSenderPubSubTopicID)
			assert.NoError(t, err)

			retrievedTopic := pubsubutils.GetTopic(
				context.TODO(),
				pubsubutils.EmailSenderPubSubTopicID,
			)
			assert.NotNil(t, retrievedTopic)

			assert.Equal(t, createdTopic.ID(), retrievedTopic.ID())
		})
		t.Run("creates and returns topic if it does not exist", func(t *testing.T) {
			topic := pubsubutils.GetTopic(context.TODO(), "does-not-exist")
			assert.NotNil(t, topic)
		})
	})

	t.Run("PublishWithRetry", func(t *testing.T) {
		t.Run("publishes message to topic", func(t *testing.T) {
			topic := pubsubutils.GetTopic(context.TODO(), pubsubutils.EmailSenderPubSubTopicID)
			message := &pubsub.Message{
				Data: []byte("test"),
			}
			err := pubsubutils.PublishWithRetry(context.TODO(), topic, message)
			assert.NoError(t, err)
		})
	})
}

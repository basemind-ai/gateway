package pubsubutils_test

import (
	"cloud.google.com/go/pubsub"
	"context"
	"github.com/basemind-ai/monorepo/shared/go/pubsubutils"
	"github.com/basemind-ai/monorepo/shared/go/testutils"
	"github.com/stretchr/testify/assert"
	"testing"
)

func TestMain(m *testing.M) {
	cleanup := testutils.CreatePubsubTestContainer()
	defer cleanup()

	m.Run()
}

func TestPubSubUtils(t *testing.T) {
	testutils.SetTestEnv(t)

	t.Run("GetClient", func(t *testing.T) {
		t.Run("creates and returns client", func(t *testing.T) {
			client := pubsubutils.GetClient(context.TODO())
			assert.NotNil(t, client)
		})
	})

	t.Run("GetTopic", func(t *testing.T) {
		t.Run("returns topic if it exists", func(t *testing.T) {
			fistTopic := pubsubutils.GetTopic(
				context.TODO(),
				"topic",
			)
			secondTopic := pubsubutils.GetTopic(
				context.TODO(),
				"topic",
			)
			assert.Equal(t, fistTopic, secondTopic)
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

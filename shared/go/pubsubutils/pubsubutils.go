package pubsubutils

import (
	"cloud.google.com/go/pubsub"
	"context"
	"fmt"
	"github.com/basemind-ai/monorepo/shared/go/config"
	"github.com/basemind-ai/monorepo/shared/go/exc"
	"github.com/cenkalti/backoff/v4"
	"github.com/rs/zerolog/log"
	"sync"
	"time"
)

var (
	client *pubsub.Client
	once   sync.Once
)

// GetClient - returns a GCP PubSub Client object.
// This function is idempotent and thread-safe.
func GetClient(ctx context.Context) *pubsub.Client {
	once.Do(func() {
		cfg := config.Get(ctx)
		client = exc.MustResult(pubsub.NewClient(ctx, cfg.GcpProjectID))
	})
	return client
}

// GetTopic - returns a GCP PubSub Topic object.
// If the topic does not exist on the GCP server or there is a communication failure, it returns an error.
func GetTopic(ctx context.Context, topicID string) (*pubsub.Topic, error) {
	topic := GetClient(ctx).Topic(topicID)

	exists, err := topic.Exists(ctx)
	if err != nil {
		return nil, fmt.Errorf("error checking topic Exists: %w", err)
	}

	if !exists {
		return nil, fmt.Errorf("topic %s does not exist", topicID)
	}

	return topic, nil
}

// PublishWithRetry - publishes a message to a GCP PubSub Topic with backoff retry.
func PublishWithRetry(ctx context.Context, topic *pubsub.Topic, message *pubsub.Message) {
	publishResult := topic.Publish(ctx, message)

	exponentialBackoff := backoff.NewExponentialBackOff()
	exponentialBackoff.MaxInterval = time.Second * 5
	exponentialBackoff.MaxElapsedTime = 20 * time.Second

	publishErr := backoff.Retry(func() error {
		id, publishErr := publishResult.Get(ctx)
		if publishErr == nil {
			log.Debug().
				Str("topic-id", topic.ID()).
				Str("server-event-id", id).
				Msg("published event to Pub/Sub")
			return nil
		}
		return publishErr
	}, exponentialBackoff)
	if publishErr != nil {
		log.Error().Err(publishErr).Msg("failed to publish event to Pub/Sub")
	}
}

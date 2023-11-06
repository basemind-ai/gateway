package pubsubutils

import (
	"cloud.google.com/go/pubsub"
	"context"
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

// SetClient - sets the GCP PubSub Client object.
func SetClient(c *pubsub.Client) {
	client = c
}

// GetClient - returns a GCP PubSub Client object.
// This function is idempotent and thread-safe.
func GetClient(ctx context.Context) *pubsub.Client {
	once.Do(func() {
		cfg := config.Get(ctx)
		SetClient(exc.MustResult(pubsub.NewClient(ctx, cfg.GcpProjectID)))
	})
	return client
}

// GetTopic - returns a GCP PubSub Topic object.
// If the topic does not exist on the GCP server, it creates the topic.
// It panics for communication failures.
func GetTopic(ctx context.Context, topicID string) *pubsub.Topic {
	topic := GetClient(ctx).Topic(topicID)

	exists := exc.MustResult(topic.Exists(ctx))

	if !exists {
		return exc.MustResult(GetClient(ctx).CreateTopic(ctx, topicID))
	}

	return topic
}

// GetSubscription - returns a GCP PubSub Subscription object.
// If the subscription does not exist on the GCP server, it creates the subscription.
// It panics for communication failures.
func GetSubscription(
	ctx context.Context,
	subscriptionID string,
	topic *pubsub.Topic,
) *pubsub.Subscription {
	subscription := GetClient(ctx).Subscription(subscriptionID)

	exists := exc.MustResult(subscription.Exists(ctx))

	if !exists {
		return exc.MustResult(
			GetClient(ctx).CreateSubscription(ctx, subscriptionID, pubsub.SubscriptionConfig{
				Topic:       topic,
				AckDeadline: 1 * time.Minute,
			}),
		)
	}

	return subscription
}

// PublishWithRetry - publishes a message to a GCP PubSub Topic with backoff retry.
func PublishWithRetry(ctx context.Context, topic *pubsub.Topic, message *pubsub.Message) error {
	publishResult := topic.Publish(ctx, message)

	exponentialBackoff := backoff.NewExponentialBackOff()
	exponentialBackoff.MaxInterval = time.Second * 5
	exponentialBackoff.MaxElapsedTime = 20 * time.Second

	return backoff.Retry(func() error {
		id, publishErr := publishResult.Get(ctx)
		if publishErr == nil {
			log.Debug().
				Str("topic-id", topic.ID()).
				Str("server-event-id", id).
				Msg("published event to Pub/Sub")
		}
		return publishErr
	}, exponentialBackoff)
}

package rediscache

import (
	"context"
	"github.com/go-redis/cache/v9"
	"github.com/redis/go-redis/v9"
	"sync"
	"time"
)

var (
	once      sync.Once
	client    *cache.Cache
	clientErr error
)

func SetClient(c *cache.Cache) {
	client = c
}

func New(redisUrl string) (*cache.Cache, error) {
	once.Do(func() {
		opt, err := redis.ParseURL(redisUrl)
		if err != nil {
			clientErr = err
			return
		}
		SetClient(cache.New(&cache.Options{
			Redis:      redis.NewClient(opt),
			LocalCache: cache.NewTinyLFU(1000, time.Minute),
		}))
	})
	return client, clientErr
}

func GetClient() *cache.Cache {
	if client == nil {
		panic("redis client is not initialized")
	}
	return client
}

// With is a helper function that will check if a key exists in redis, and if it does, it will return the value. If it
// does not exist, it will call the fallback function, set the value in redis, and return the value.
func With[T interface{}](ctx context.Context, key string, target *T, ttl time.Duration, fallback func() (*T, error)) (*T, error) {
	if getErr := client.Get(ctx, key, target); getErr == nil {
		return target, nil
	}
	retrieved, retrieveErr := fallback()
	if retrieveErr != nil {
		return nil, retrieveErr
	}
	if setErr := client.Set(&cache.Item{
		Ctx:   ctx,
		Key:   key,
		Value: *retrieved,
		TTL:   ttl,
	}); setErr != nil {
		return nil, setErr
	}
	return retrieved, nil
}

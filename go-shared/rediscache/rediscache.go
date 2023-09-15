package rediscache

import (
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

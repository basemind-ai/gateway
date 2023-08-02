package cache

import (
	"os"
	"sync"

	"github.com/go-redis/redismock/v9"

	"github.com/redis/go-redis/v9"
	"github.com/rs/zerolog/log"
)

var (
	once   sync.Once
	client *redis.Client
)

func Get() *redis.Client {
	once.Do(func() {
		redisConnectionString := os.Getenv("REDIS_CONNECTION_STRING")
		opt, err := redis.ParseURL(redisConnectionString)
		if err != nil {
			log.Fatal().Err(err).Msg("failed to init redis")
		}

		client = redis.NewClient(opt)
	})
	return client
}

func CreatMockClient() redismock.ClientMock {
	db, mock := redismock.NewClientMock()
	client = db
	return mock
}

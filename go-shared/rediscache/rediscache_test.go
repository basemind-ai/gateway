package rediscache_test

import (
	"github.com/basemind-ai/monorepo/go-shared/rediscache"
	"github.com/stretchr/testify/assert"
	"testing"
)

func TestRedisClient(t *testing.T) {
	t.Run("GetClient Panics if client not initialized", func(t *testing.T) {
		assert.Panics(t, func() {
			rediscache.GetClient()
		})
	})

	t.Run("GetClient does not panic if client is initialized", func(t *testing.T) {
		assert.NotPanics(t, func() {
			_, _ = rediscache.New("redis://redis:6379")
			rediscache.GetClient()
		})
	})

	// test below currently fails due to: https://github.com/go-redis/redismock/issues/83

	// t.Run("Caches values as expected", func(t *testing.T) {
	//	_, err := rediscache.New("redis://redis:6379")
	//	assert.Nil(t, err)
	//
	//	db, mockRedis := redismock.NewClientMock() //nolint: typecheck
	//
	//	rediscache.SetClient(cache.New(&cache.Options{
	//		Redis: db,
	//	}))
	//
	//	client := rediscache.GetClient()
	//
	//	key := "john"
	//
	//	val := &cache.Item{
	//		TTL:   time.Minute,
	//		Key:   key,
	//		Value: "doe",
	//	}
	//
	//	expected, _ := client.Marshal("doe")
	//
	//	mockRedis.ExpectSet(key, expected, time.Minute).SetVal("OK")
	//	setErr := client.Set(val)
	//	assert.NoError(t, setErr)
	// })
}

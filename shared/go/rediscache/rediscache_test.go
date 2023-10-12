package rediscache_test

import (
	"context"
	"github.com/basemind-ai/monorepo/shared/go/rediscache"
	"github.com/go-redis/cache/v9"
	"github.com/go-redis/redismock/v9"
	"github.com/stretchr/testify/assert"
	"testing"
	"time"
)

func TestRedisClient(t *testing.T) {
	key := "john"
	val := &cache.Item{
		TTL:   time.Minute,
		Key:   key,
		Value: "doe",
	}

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

	t.Run("Caches values as expected", func(t *testing.T) {
		_, err := rediscache.New("redis://redis:6379")
		assert.Nil(t, err)

		db, mockRedis := redismock.NewClientMock()
		rediscache.SetClient(cache.New(&cache.Options{
			Redis: db,
		}))

		client := rediscache.GetClient()

		expected, _ := client.Marshal("doe")

		mockRedis.ExpectSet(key, expected, time.Minute).SetVal("OK")
		setErr := client.Set(val)
		assert.NoError(t, setErr)
	})
	t.Run("With", func(t *testing.T) {
		fallback := func() (*string, error) {
			v := "zuchmir"
			return &v, nil
		}

		t.Run("returns value from cache if it exists", func(t *testing.T) {
			db, mockRedis := redismock.NewClientMock()
			rediscache.SetClient(cache.New(&cache.Options{
				Redis: db,
			}))

			db.Set(context.TODO(), key, val, time.Second)
			mockRedis.ExpectGet(key).SetVal("doe")

			var target string
			retrieved, retrieveErr := rediscache.With(
				context.TODO(),
				key,
				&target,
				time.Minute,
				fallback,
			)
			assert.NoError(t, retrieveErr)
			assert.Equal(t, "doe", *retrieved)
		})
		t.Run(
			"calls fallback function and sets cache if value does not exist in cache",
			func(t *testing.T) {
				db, mockRedis := redismock.NewClientMock()
				rediscache.SetClient(cache.New(&cache.Options{
					Redis: db,
				}))

				client := rediscache.GetClient()

				mockRedis.ExpectGet(key).RedisNil()
				expected, _ := client.Marshal("zuchmir")

				mockRedis.ExpectSet(key, expected, time.Minute).SetVal("OK")

				var target string
				retrieved, retrieveErr := rediscache.With(
					context.TODO(),
					key,
					&target,
					time.Minute,
					fallback,
				)
				assert.NoError(t, retrieveErr)
				assert.Equal(t, "zuchmir", *retrieved)
			},
		)
		t.Run("returns error if fallback function returns error", func(t *testing.T) {
			db, mockRedis := redismock.NewClientMock()
			rediscache.SetClient(cache.New(&cache.Options{
				Redis: db,
			}))

			mockRedis.ExpectGet(key).RedisNil()

			fallback := func() (*string, error) {
				return nil, assert.AnError
			}

			var target string
			retrieved, retrieveErr := rediscache.With(
				context.TODO(),
				key,
				&target,
				time.Minute,
				fallback,
			)
			assert.Error(t, retrieveErr)
			assert.Nil(t, retrieved)
		})
	})

	t.Run("Invalidate", func(t *testing.T) {
		t.Run("invalidates keys as expected", func(t *testing.T) {
			db, mockRedis := redismock.NewClientMock()
			rediscache.SetClient(cache.New(&cache.Options{
				Redis: db,
			}))

			mockRedis.ExpectDel(key).SetVal(1)

			rediscache.Invalidate(context.TODO(), key)
		})
	})
}

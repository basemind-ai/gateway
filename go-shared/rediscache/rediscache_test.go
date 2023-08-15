package rediscache_test

import (
	"context"
	"testing"
	"time"

	"github.com/basemind-ai/backend-services/go-shared/rediscache"
	"github.com/go-redis/redismock/v9"
	"github.com/stretchr/testify/assert"
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

	client, err := rediscache.New("redis://redis:6379")
	assert.Nil(t, err)

	db, mockRedis := redismock.NewClientMock()
	client.SetConn(db)

	key := "john"
	val := []byte("doe")

	t.Cleanup(func() {
		_ = client.Reset(context.TODO())
	})

	t.Run("Set", func(t *testing.T) {
		mockRedis.ExpectSet(key, val, 0).SetVal("OK")
		err := client.Set(context.TODO(), key, val, 0)
		assert.Equal(t, nil, err)
	})

	t.Run("Set overwrite key expiration", func(t *testing.T) {
		mockRedis.ExpectSet(key, val, 0).SetVal("OK")
		err := client.Set(context.TODO(), key, val, 0)
		assert.Equal(t, nil, err)

		mockRedis.ExpectSet(key, val, 0).SetVal("OK")
		err = client.Set(context.TODO(), key, val, 0)
		assert.Equal(t, nil, err)
	})

	t.Run("Set Expiration", func(t *testing.T) {
		exp := 1 * time.Second
		mockRedis.ExpectSet(key, val, exp).SetVal("OK")
		err := client.Set(context.TODO(), key, val, exp)
		assert.Equal(t, nil, err)
	})

	t.Run("Get", func(t *testing.T) {
		mockRedis.ExpectSet(key, val, 0).SetVal("OK")
		err := client.Set(context.TODO(), key, val, 0)
		assert.Equal(t, nil, err)

		mockRedis.ExpectGet(key).SetVal(string(val))
		result, err := client.Get(context.TODO(), key)
		assert.Equal(t, nil, err)
		assert.Equal(t, val, result)
	})

	t.Run("Get Expired", func(t *testing.T) {
		expiredKey := "john"
		mockRedis.ExpectGet(expiredKey).RedisNil()
		result, err := client.Get(context.TODO(), expiredKey)
		assert.Equal(t, nil, err)
		assert.Equal(t, true, len(result) == 0)
	})

	t.Run("Get Non-Existing", func(t *testing.T) {
		mockRedis.ExpectGet("nope").RedisNil()
		result, err := client.Get(context.TODO(), "nope")
		assert.Equal(t, nil, err)
		assert.Equal(t, true, len(result) == 0)
	})

	t.Run("Delete", func(t *testing.T) {
		mockRedis.ExpectSet(key, val, 0).SetVal("OK")
		err := client.Set(context.TODO(), key, val, 0)
		assert.Equal(t, nil, err)

		mockRedis.ExpectDel(key).SetVal(1)
		err = client.Delete(context.TODO(), key)
		assert.Equal(t, nil, err)

		mockRedis.ExpectGet(key).RedisNil()
		result, err := client.Get(context.TODO(), key)
		assert.Equal(t, nil, err)
		assert.Equal(t, true, len(result) == 0)
	})

	t.Run("Reset", func(t *testing.T) {
		mockRedis.ExpectSet("john1", val, 0).SetVal("OK")
		err := client.Set(context.TODO(), "john1", val, 0)
		assert.Equal(t, nil, err)

		mockRedis.ExpectSet("john2", val, 0).SetVal("OK")
		err = client.Set(context.TODO(), "john2", val, 0)
		assert.Equal(t, nil, err)

		mockRedis.ExpectFlushDB().SetVal("OK")
		err = client.Reset(context.TODO())
		assert.Equal(t, nil, err)

		mockRedis.ExpectGet("john1").RedisNil()
		result, err := client.Get(context.TODO(), "john1")
		assert.Equal(t, nil, err)
		assert.Equal(t, true, len(result) == 0)

		mockRedis.ExpectGet("john2").RedisNil()
		result, err = client.Get(context.TODO(), "john2")
		assert.Equal(t, nil, err)
		assert.Equal(t, true, len(result) == 0)
	})

	t.Run("Close", func(t *testing.T) {
		assert.Equal(t, nil, client.Close())
	})

	t.Run("GetConn", func(t *testing.T) {
		assert.Equal(t, true, client.GetConn() != nil)
	})
}

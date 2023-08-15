package rediscache

import (
	"context"
	"errors"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
)

var (
	once      sync.Once
	client    *Client
	clientErr error
)

type Client struct {
	client *redis.Client
}

// Get value by key.
func (c *Client) Get(ctx context.Context, key string) ([]byte, error) {
	if len(key) == 0 {
		return nil, nil
	}
	val, err := c.client.Get(ctx, key).Bytes()
	if errors.Is(err, redis.Nil) {
		return nil, nil
	}
	return val, err
}

// Set value for key.
func (c *Client) Set(ctx context.Context, key string, val []byte, exp time.Duration) error {
	if len(key) == 0 || len(val) == 0 {
		return nil
	}
	return c.client.Set(ctx, key, val, exp).Err()
}

// Delete key-value pair.
func (c *Client) Delete(ctx context.Context, key string) error {
	if len(key) == 0 {
		return nil
	}
	return c.client.Del(ctx, key).Err()
}

// Reset all keys.
func (c *Client) Reset(ctx context.Context) error {
	return c.client.FlushDB(ctx).Err()
}

// Close the database.
func (c *Client) Close() error {
	return c.client.Close()
}

// GetConn return the redis client.
func (c *Client) GetConn() *redis.Client {
	return c.client
}

// SetConn set the redis client.
func (c *Client) SetConn(client *redis.Client) {
	c.client = client
}

func New(redisUrl string) (*Client, error) {
	once.Do(func() {
		opt, err := redis.ParseURL(redisUrl)
		if err != nil {
			clientErr = err
			return
		}
		client = &Client{client: redis.NewClient(opt)}
	})
	return client, clientErr
}

func GetClient() *Client {
	if client == nil {
		panic("redis client is not initialized")
	}
	return client
}

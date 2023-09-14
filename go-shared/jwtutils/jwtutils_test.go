package jwtutils_test

import (
	"testing"
	"time"

	"github.com/basemind-ai/monorepo/go-shared/jwtutils"
	"github.com/stretchr/testify/assert"
)

func TestJwtUtils(t *testing.T) {
	t.Run("creates token correctly", func(t *testing.T) {
		expiration := time.Now().Add(time.Hour)
		secret := []byte("abc123abrakadabra")

		values := map[string]string{
			"key1": "value1",
			"key2": "value2",
		}

		token, createTokenErr := jwtutils.CreateToken(expiration, secret, values)

		assert.NoError(t, createTokenErr)
		assert.NotEmpty(t, token)

		claims, parseTokenErr := jwtutils.ParseToken(token, secret)

		assert.NoError(t, parseTokenErr)
		assert.Equal(t, float64(expiration.Unix()), claims["exp"])
		assert.Equal(t, values["key1"], claims["key1"])
		assert.Equal(t, values["key2"], claims["key2"])
	})
}

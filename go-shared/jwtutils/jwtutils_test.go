package jwtutils_test

import (
	"github.com/golang-jwt/jwt/v5"
	"testing"
	"time"

	"github.com/basemind-ai/monorepo/go-shared/jwtutils"
	"github.com/stretchr/testify/assert"
)

func TestJwtUtils(t *testing.T) {
	t.Run("creates and parses token correctly", func(t *testing.T) {
		secret := []byte("abc123abrakadabra")

		token, createTokenErr := jwtutils.CreateJWT(time.Hour, secret, "test-subject")
		assert.NoError(t, createTokenErr)
		assert.NotEmpty(t, token)

		claims, parseTokenErr := jwtutils.ParseJWT(token, secret)
		assert.NoError(t, parseTokenErr)

		exp, err := claims.GetExpirationTime()
		assert.NoError(t, err)
		assert.Equal(t, jwt.NewNumericDate(time.Now().Add(time.Hour)), exp)

		sub, err := claims.GetSubject()
		assert.NoError(t, err)
		assert.Equal(t, "test-subject", sub)
	})

	t.Run("fails to parse invalid token", func(t *testing.T) {
		token := "invalid_token"
		secret := []byte("abc123abrakadabra")

		_, err := jwtutils.ParseJWT(token, secret)
		assert.Error(t, err)
	})
}

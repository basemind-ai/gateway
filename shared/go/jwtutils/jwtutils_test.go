package jwtutils_test

import (
	"github.com/basemind-ai/monorepo/shared/go/jwtutils"
	"github.com/golang-jwt/jwt/v5"
	"testing"
	"time"

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

	t.Run("handles signature failures", func(t *testing.T) {
		token := "eyJhbGciOiJQUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.iOeNU4dAFFeBwNj6qdhdvm-IvDQrTa6R22lQVJVuWJxorJfeQww5Nwsra0PjaOYhAMj9jNMO5YLmud8U7iQ5gJK2zYyepeSuXhfSi8yjFZfRiSkelqSkU19I-Ja8aQBDbqXf2SAWA8mHF8VS3F08rgEaLCyv98fLLH4vSvsJGf6ueZSLKDVXz24rZRXGWtYYk_OYYTVgR1cg0BLCsuCvqZvHleImJKiWmtS0-CymMO4MMjCy_FIl6I56NqLE9C87tUVpo1mT-kbg5cHDD8I7MjCW5Iii5dethB4Vid3mZ6emKjVYgXrtkOQ-JyGMh6fnQxEFN1ft33GX2eRHluK9eg" //nolint: gosec
		secret := []byte("your-512-bit-secret")

		_, err := jwtutils.ParseJWT(token, secret)
		assert.Error(t, err)
	})

	t.Run("handles algorithm failure", func(t *testing.T) {
		token := "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.VFb0qJ1LRg_4ujbZoRMXnVkUgiuKq5KxWqNdbKq_G9Vvz-S1zZa9LPxtHWKa64zDl2ofkT8F6jBt_K4riU-fPg" //nolint: gosec
		secret := []byte("your-512-bit-secret")

		_, err := jwtutils.ParseJWT(token, secret)
		assert.Error(t, err)
	})

	t.Run("fails to parse invalid token", func(t *testing.T) {
		token := "invalid_token"
		secret := []byte("abc123abrakadabra")

		_, err := jwtutils.ParseJWT(token, secret)
		assert.Error(t, err)
	})

	t.Run("fails to parse token with invalid expiration", func(t *testing.T) {
		secret := []byte("abc123abrakadabra")
		token, err := jwtutils.CreateJWT(1*time.Millisecond, secret, "abc")
		assert.NoError(t, err)

		time.Sleep(100 * time.Millisecond)

		_, err = jwtutils.ParseJWT(token, secret)
		assert.Error(t, err)
	})
}

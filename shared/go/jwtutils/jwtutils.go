package jwtutils

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// CreateJWT - creates a JWT token with the given TTL and subject.
func CreateJWT(
	ttl time.Duration,
	secret []byte,
	sub string,
) (string, error) {
	claims := jwt.MapClaims{
		"sub": sub,
	}

	if ttl > 0 {
		claims["exp"] = time.Now().UTC().Add(ttl).Unix()
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(secret)
}

// ParseJWT - parses a JWT token and returns the claims.
// If the token is invalid or expired, an error is returned.
func ParseJWT(encodedString string, secret []byte) (jwt.Claims, error) {
	parsedToken, err := jwt.Parse(
		encodedString,
		func(encodedToken *jwt.Token) (any, error) {
			// we verify that the signing method is HMAC
			_, ok := encodedToken.Method.(*jwt.SigningMethodHMAC)
			if !ok {
				return nil, fmt.Errorf("signing failure")
			}
			// we verify that the token was signed with the HS256 algo
			if encodedToken.Method.Alg() != "HS256" {
				return nil, fmt.Errorf("algorithm mismatch")
			}
			// we return the secret we use to sign tokens, seeing if the token parses
			return secret, nil
		},
	)

	if err != nil {
		return nil, fmt.Errorf("error parsing token %w", err)
	}

	return parsedToken.Claims, nil
}

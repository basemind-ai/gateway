package jwtutils

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func CreateJWT(ttl time.Duration, secret []byte, sub string) (string, error) {
	claims := jwt.MapClaims{
		"sub": sub,
	}

	if ttl > 0 {
		claims["exp"] = time.Now().Add(ttl).Unix()
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(secret)
}

func ParseJWT(encodedString string, secret []byte) (jwt.Claims, error) {
	parsedToken, signingErr := jwt.Parse(
		encodedString,
		func(encodedToken *jwt.Token) (interface{}, error) {
			_, ok := encodedToken.Method.(*jwt.SigningMethodHMAC)
			if !ok {
				return nil, fmt.Errorf("signing method failure")
			}
			return secret, nil
		},
	)

	if signingErr != nil {
		return nil, fmt.Errorf("error parsing token %w", signingErr)
	}

	if !parsedToken.Valid {
		return nil, fmt.Errorf("invalid token")
	}

	return parsedToken.Claims, nil
}

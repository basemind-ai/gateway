package jwtutils

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func CreateToken(expiration time.Time, secret []byte, values map[string]string) (string, error) {
	token := jwt.New(jwt.SigningMethodHS256)

	claims := token.Claims.(jwt.MapClaims)
	claims["exp"] = expiration.Unix()

	for key, value := range values {
		claims[key] = value
	}

	return token.SignedString(secret)
}

func ParseToken(encodedString string, secret []byte) (map[string]interface{}, error) {
	parsedToken, err := jwt.Parse(encodedString, func(encodedToken *jwt.Token) (interface{}, error) {
		_, ok := encodedToken.Method.(*jwt.SigningMethodHMAC)
		if !ok {
			return nil, fmt.Errorf("signing method failure")
		}
		return secret, nil
	})

	if err != nil {
		return nil, fmt.Errorf("error parsing token %w", err)
	}

	if !parsedToken.Valid {
		return nil, fmt.Errorf("invalid token")
	}

	claims, claimsOk := parsedToken.Claims.(jwt.MapClaims)

	if !claimsOk {
		return nil, fmt.Errorf("unable to parse claims from token")
	}

	return claims, nil
}

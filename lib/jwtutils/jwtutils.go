package jwtutils

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt"
)

func CreateToken(sub string, expiration time.Time, secret string) (string, error) {
	token := jwt.New(jwt.SigningMethodEdDSA)

	claims := token.Claims.(jwt.MapClaims)
	claims["exp"] = expiration
	claims["sub"] = sub

	return token.SignedString([]byte(secret))
}

func ParseToken(encodedString string, secret string) (string, error) {
	parsedToken, err := jwt.Parse(encodedString, func(encodedToken *jwt.Token) (interface{}, error) {
		_, ok := encodedToken.Method.(*jwt.SigningMethodECDSA)
		if !ok {
			return nil, fmt.Errorf("signing method failure")
		}
		return []byte(secret), nil
	})

	if err != nil {
		return "", fmt.Errorf("error parsing token %w", err)
	}

	if !parsedToken.Valid {
		return "", fmt.Errorf("invalid token")
	}

	claims, claimsOk := parsedToken.Claims.(jwt.MapClaims)

	if !claimsOk {
		return "", fmt.Errorf("unable to parse claims from token")
	}

	sub, subOk := claims["sub"].(string)
	if !subOk {
		return "", fmt.Errorf("unable to extract sub from claims")
	}

	return sub, nil
}

package utils

import (
	"crypto/rand"
	"encoding/base64"
	"io"
)

func CreateStateString() string {
	nonce := make([]byte, 64)
	_, _ = io.ReadFull(rand.Reader, nonce)
	return base64.URLEncoding.EncodeToString(nonce)
}

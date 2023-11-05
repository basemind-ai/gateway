package urlutils

import (
	"context"
	"fmt"
	"github.com/basemind-ai/monorepo/shared/go/config"
	"strings"
	"sync"
	"time"

	"github.com/leg100/surl"
)

var (
	signer *surl.Signer
	once   sync.Once
)

// GetSigner returns the signer object, initializing it if necessary.
func GetSigner(ctx context.Context) *surl.Signer {
	once.Do(func() {
		cfg := config.Get(ctx)
		signer = surl.New([]byte(cfg.URLSigningSecret))
	})
	return signer
}

// SignURL signs the given url with the given secret and returns the signed url.
func SignURL(ctx context.Context, url string) (string, error) {
	signed, signingErr := GetSigner(ctx).Sign(url, time.Hour)
	if signingErr != nil {
		return "", fmt.Errorf("failed to sign url: %w", signingErr)
	}

	if verificationErr := GetSigner(ctx).Verify(signed); verificationErr != nil {
		return "", fmt.Errorf("failed to verify url: %w", verificationErr)
	}

	return signed, nil
}

// VerifyURL verifies the given url.
// Because our testing environment does not support https, and our production env
// will be running in https, we have to handle a situation where both http and https
// might be used.
func VerifyURL(ctx context.Context, url string) error {
	if strings.HasPrefix(url, "http") {
		return GetSigner(ctx).Verify(url)
	}
	for _, prefix := range []string{"http", "https"} {
		err := GetSigner(ctx).Verify(fmt.Sprintf("%s://%s", prefix, url))
		if err == nil {
			return nil
		}
	}
	return fmt.Errorf("invalid url: %s", url)
}

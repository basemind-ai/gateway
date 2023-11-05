package urlutils

import (
	"context"
	"fmt"
	"github.com/basemind-ai/monorepo/shared/go/config"
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
		signer = surl.New([]byte(cfg.URLSigningSecret), surl.WithPathFormatter())
	})
	return signer
}

// SignURL signs the given url with the given secret and returns the signed url.
func SignURL(ctx context.Context, url string) (string, error) {
	signed, signingErr := GetSigner(ctx).Sign(url, time.Hour)
	if signingErr != nil {
		return "", fmt.Errorf("failed to sign url: %w", signingErr)
	}

	if verificationErr := signer.Verify(signed); verificationErr != nil {
		return "", fmt.Errorf("failed to verify url: %w", verificationErr)
	}

	return signed, nil
}

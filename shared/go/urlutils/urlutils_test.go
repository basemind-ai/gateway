package urlutils_test

import (
	"context"
	"github.com/basemind-ai/monorepo/shared/go/testutils"
	"github.com/basemind-ai/monorepo/shared/go/urlutils"
	"github.com/stretchr/testify/assert"
	"testing"
)

func TestURUtils(t *testing.T) {
	testutils.SetTestEnv(t)

	t.Run("GetSigner", func(t *testing.T) {
		t.Run("initializes a new signer", func(t *testing.T) {
			signer := urlutils.GetSigner(context.TODO())
			assert.NotNil(t, signer)
		})

		t.Run("returns the same signer on subsequent calls", func(t *testing.T) {
			signer1 := urlutils.GetSigner(context.TODO())
			signer2 := urlutils.GetSigner(context.TODO())
			assert.Equal(t, signer1, signer2)
		})
	})

	t.Run("SignURL", func(t *testing.T) {
		t.Run("returns a signed url", func(t *testing.T) {
			url := "https://example.com/a/b/c?foo=bar"
			signed, err := urlutils.SignURL(context.TODO(), url)
			assert.NoError(t, err)
			assert.NotEmpty(t, signed)
			assert.NotEqual(t, url, signed)
		})

		t.Run("returns an error if the url is invalid", func(t *testing.T) {
			url := "invalid"
			signed, err := urlutils.SignURL(context.TODO(), url)
			assert.Error(t, err)
			assert.Empty(t, signed)
		})

		t.Run("returns a verification error for root url", func(t *testing.T) {
			url := "https://example.com"
			signed, err := urlutils.SignURL(context.TODO(), url)
			assert.Error(t, err)
			assert.Empty(t, signed)
		})
	})
}

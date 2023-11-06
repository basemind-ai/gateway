package urlutils_test

import (
	"context"
	"github.com/basemind-ai/monorepo/shared/go/testutils"
	"github.com/basemind-ai/monorepo/shared/go/urlutils"
	"github.com/stretchr/testify/assert"
	"strings"
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

		t.Run("returns an error if the url is empty", func(t *testing.T) {
			url := ""
			signed, err := urlutils.SignURL(context.TODO(), url)
			assert.Error(t, err)
			assert.Empty(t, signed)
		})

		t.Run("returns verification error if url is missing schema", func(t *testing.T) {
			url := "example.com/a/b/c?foo=bar"
			signed, err := urlutils.SignURL(context.TODO(), url)
			assert.Error(t, err)
			assert.Empty(t, signed)
		})
	})

	t.Run("VerifyURL", func(t *testing.T) {
		validURL := "https://example.com/a/b/c?foo=bar"
		signed, err := urlutils.SignURL(context.TODO(), validURL)
		assert.NoError(t, err)
		assert.NotEmpty(t, signed)

		for _, variant := range []string{signed, strings.ReplaceAll(signed, "https://", ""), strings.ReplaceAll(signed, "http://", "")} {
			t.Run("returns nil if the url is valid", func(t *testing.T) {
				err = urlutils.VerifyURL(context.TODO(), variant)
				assert.NoError(t, err)
			})
		}

		t.Run("returns an error if the url is invalid", func(t *testing.T) {
			err = urlutils.VerifyURL(context.TODO(), "invalid")
			assert.Error(t, err)
		})

		t.Run("returns an error if the url is empty", func(t *testing.T) {
			err = urlutils.VerifyURL(context.TODO(), "")
			assert.Error(t, err)
		})

		t.Run("returns an error if the url is missing schema", func(t *testing.T) {
			err = urlutils.VerifyURL(context.TODO(), "example.com/a/b/c?foo=bar")
			assert.Error(t, err)
		})
	})
}

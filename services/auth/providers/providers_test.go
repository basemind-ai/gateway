package providers_test

import (
	"context"
	"testing"

	"github.com/basemind-ai/backend-services/services/auth/providers"
	"github.com/basemind-ai/backend-services/services/auth/types"
	"github.com/stretchr/testify/assert"
)

func TestGetProvider(t *testing.T) {
	for _, testCase := range []struct {
		Provider    string
		ExpectError bool
	}{
		{
			types.ProviderGithub,
			false,
		},
		{
			types.ProviderGitlab,
			true,
		},
		{
			types.ProviderBitBucket,
			true,
		},
		{
			types.ProviderGoogle,
			true,
		},
		{
			"facebook",
			true,
		},
	} {
		config, err := providers.GetProvider(context.TODO(), testCase.Provider)
		if testCase.ExpectError {
			assert.Nil(t, config)
			assert.NotNil(t, err)
		} else {
			assert.NotNil(t, config)
			assert.Nil(t, err)
		}
	}
}

package grpcutils_test

import (
	"context"
	"fmt"
	"github.com/basemind-ai/monorepo/shared/go/grpcutils"
	"github.com/basemind-ai/monorepo/shared/go/jwtutils"
	"github.com/stretchr/testify/assert"
	"google.golang.org/grpc/metadata"
	"testing"
	"time"
)

func TestAuthHandler(t *testing.T) {
	t.Run("HandleAuth returns the claims for a valid token", func(t *testing.T) {
		secret := "valid_secret"
		sub := "123jeronimo"

		encodedToken, tokenErr := jwtutils.CreateJWT(5*time.Minute, []byte(secret), sub)
		assert.NoError(t, tokenErr)

		handler := grpcutils.NewAuthHandler(secret)
		ctx := metadata.NewIncomingContext(
			context.TODO(),
			metadata.Pairs("authorization", fmt.Sprintf("bearer %s", encodedToken)),
		)
		newCtx, err := handler.HandleAuth(ctx)
		assert.NoError(t, err)

		ctxSub, ok := newCtx.Value(grpcutils.ApplicationIDContextKey).(string)
		assert.True(t, ok)
		assert.Equal(t, sub, ctxSub)
	})
}

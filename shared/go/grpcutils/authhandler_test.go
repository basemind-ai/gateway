package grpcutils_test

import (
	"context"
	"fmt"
	"github.com/basemind-ai/monorepo/e2e/factories"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/grpcutils"
	"github.com/basemind-ai/monorepo/shared/go/jwtutils"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/assert"
	"google.golang.org/grpc/metadata"
	"testing"
	"time"
)

func TestAuthHandler(t *testing.T) {
	project, _ := factories.CreateProject(context.TODO())
	application, _ := factories.CreateApplication(context.TODO(), project.ID)
	token, _ := factories.CreateApplicationInternalToken(context.TODO(), application.ID)
	tokenID := db.UUIDToString(&token.ID)
	secret := "valid_secret"

	t.Run("HandleAuth", func(t *testing.T) {
		t.Run("sets applicationID in context for a valid auth token", func(t *testing.T) {
			encodedToken, tokenErr := jwtutils.CreateJWT(5*time.Minute, []byte(secret), tokenID)
			assert.NoError(t, tokenErr)

			handler := grpcutils.NewAuthHandler(secret)
			ctx := metadata.NewIncomingContext(
				context.TODO(),
				metadata.Pairs("authorization", fmt.Sprintf("bearer %s", encodedToken)),
			)
			newCtx, err := handler.HandleAuth(ctx)
			assert.NoError(t, err)

			ctxValue, ok := newCtx.Value(grpcutils.ApplicationIDContextKey).(pgtype.UUID)
			assert.True(t, ok)
			assert.Equal(t, ctxValue, application.ID)
		})

		t.Run("returns unauthenticated status for missing bearer metadata", func(t *testing.T) {
			handler := grpcutils.NewAuthHandler(secret)
			_, err := handler.HandleAuth(context.TODO())
			assert.Error(t, err)
			assert.Contains(t, err.Error(), "rpc error: code = Unauthenticated")
		})

		t.Run("returns unauthenticated status for empty bearer token", func(t *testing.T) {
			handler := grpcutils.NewAuthHandler(secret)
			ctx := metadata.NewIncomingContext(
				context.TODO(),
				metadata.Pairs("authorization", "bearer"),
			)
			_, err := handler.HandleAuth(ctx)
			assert.Error(t, err)
			assert.Contains(t, err.Error(), "rpc error: code = Unauthenticated")
		})

		t.Run("returns unauthenticated status for invalid bearer token", func(t *testing.T) {
			handler := grpcutils.NewAuthHandler(secret)
			ctx := metadata.NewIncomingContext(
				context.TODO(),
				metadata.Pairs("authorization", "bearer invalid_token"),
			)
			_, err := handler.HandleAuth(ctx)
			assert.Error(t, err)
			assert.Contains(t, err.Error(), "rpc error: code = Unauthenticated")
		})

		t.Run("returns unauthenticated status for token without a sub", func(t *testing.T) {
			encodedToken, tokenErr := jwtutils.CreateJWT(5*time.Minute, []byte(secret), "")
			assert.NoError(t, tokenErr)

			handler := grpcutils.NewAuthHandler(secret)
			ctx := metadata.NewIncomingContext(
				context.TODO(),
				metadata.Pairs("authorization", fmt.Sprintf("bearer %s", encodedToken)),
			)
			_, err := handler.HandleAuth(ctx)
			assert.Error(t, err)
			assert.Contains(t, err.Error(), "rpc error: code = Unauthenticated")
		})

		t.Run("returns unauthenticated status for invalid token ID", func(t *testing.T) {
			encodedToken, tokenErr := jwtutils.CreateJWT(
				5*time.Minute,
				[]byte(secret),
				"869664fd-3dac-424a-9867-c87884190b5d",
			)
			assert.NoError(t, tokenErr)

			handler := grpcutils.NewAuthHandler(secret)
			ctx := metadata.NewIncomingContext(
				context.TODO(),
				metadata.Pairs("authorization", fmt.Sprintf("bearer %s", encodedToken)),
			)
			_, err := handler.HandleAuth(ctx)
			assert.Error(t, err)
			assert.Contains(t, err.Error(), "rpc error: code = Unauthenticated")
		})

		t.Run(
			"returns unauthenticated status for a token with a deleted application",
			func(t *testing.T) {
				newApplication, _ := factories.CreateApplication(context.TODO(), project.ID)
				newToken, _ := factories.CreateApplicationInternalToken(
					context.TODO(),
					newApplication.ID,
				)

				delErr := db.GetQueries().DeleteApplication(context.TODO(), newApplication.ID)
				assert.NoError(t, delErr)

				encodedToken, tokenErr := jwtutils.CreateJWT(
					5*time.Minute,
					[]byte(secret),
					db.UUIDToString(&newToken.ID),
				)
				assert.NoError(t, tokenErr)

				handler := grpcutils.NewAuthHandler(secret)
				ctx := metadata.NewIncomingContext(
					context.TODO(),
					metadata.Pairs("authorization", fmt.Sprintf("bearer %s", encodedToken)),
				)
				_, err := handler.HandleAuth(ctx)
				assert.Error(t, err)
				assert.Contains(t, err.Error(), "rpc error: code = Unauthenticated")
			},
		)
	})
}

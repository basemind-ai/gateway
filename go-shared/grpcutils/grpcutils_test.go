package grpcutils_test

import (
	"bytes"
	"context"
	"fmt"
	"github.com/basemind-ai/monorepo/go-services/api-gateway/constants"
	"github.com/basemind-ai/monorepo/go-shared/grpcutils"
	"github.com/basemind-ai/monorepo/go-shared/jwtutils"
	loggingMiddleware "github.com/grpc-ecosystem/go-grpc-middleware/v2/interceptors/logging"
	"github.com/rs/zerolog/log"
	"github.com/stretchr/testify/assert"
	"google.golang.org/grpc"
	"google.golang.org/grpc/metadata"
	"testing"
	"time"
)

func TestGrpcUtils(t *testing.T) {
	t.Run("CreateGRPCServer creates a server instance", func(t *testing.T) {
		server := grpcutils.CreateGRPCServer(grpcutils.Options[any]{
			Environment:   "development",
			GrpcRegistrar: func(s grpc.ServiceRegistrar, srv interface{}) {},
			Service:       struct{}{},
			ServiceName:   "test-service",
			AuthHandler: func(ctx context.Context) (context.Context, error) {
				return ctx, nil
			},
		})
		assert.NotNil(t, server)
	})

	t.Run("CreateInterceptorLogger returns the expected values", func(t *testing.T) {
		loggerFunc, opts := grpcutils.CreateInterceptorLogger(true)
		assert.NotNil(t, loggerFunc)
		assert.NotNil(t, opts)
	})

	t.Run("CreateInterceptorLogger handler functions logs at all levels correctly", func(t *testing.T) {
		loggerFunc, _ := grpcutils.CreateInterceptorLogger(true)

		var buf bytes.Buffer
		log.Logger = log.Output(&buf)

		loggerFunc.Log(context.Background(), loggingMiddleware.LevelDebug, "debug message")
		loggerFunc.Log(context.Background(), loggingMiddleware.LevelInfo, "info message")
		loggerFunc.Log(context.Background(), loggingMiddleware.LevelWarn, "warn message")
		loggerFunc.Log(context.Background(), loggingMiddleware.LevelError, "error message")

		assert.Contains(t, buf.String(), "debug message")
		assert.Contains(t, buf.String(), "info message")
		assert.Contains(t, buf.String(), "warn message")
		assert.Contains(t, buf.String(), "error message")
	})

	t.Run("RecoveryHandler logs panic message and formats the error as expected", func(t *testing.T) {
		var buf bytes.Buffer
		log.Logger = log.Output(&buf)

		err := grpcutils.RecoveryHandler("test panic")

		assert.Error(t, err)
		assert.Contains(t, buf.String(), "panic triggered: test panic")
	})

	t.Run("AuthHandler", func(t *testing.T) {
		t.Run("HandleAuth returns the claims for a valid token", func(t *testing.T) {
			secret := "valid_secret"
			sub := "123jeronimo"

			encodedToken, tokenErr := jwtutils.CreateJWT(5*time.Minute, []byte(secret), sub)
			assert.NoError(t, tokenErr)

			handler := grpcutils.NewAuthHandler(secret)
			ctx := metadata.NewIncomingContext(context.Background(), metadata.Pairs("authorization", fmt.Sprintf("bearer %s", encodedToken)))
			newCtx, err := handler.HandleAuth(ctx)
			assert.NoError(t, err)

			ctxSub, ok := newCtx.Value(constants.ApplicationIDContextKey).(string)
			assert.True(t, ok)
			assert.Equal(t, sub, ctxSub)
		})
	})
}

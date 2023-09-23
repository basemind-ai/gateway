package grpcutils_test

import (
	"bytes"
	"context"
	"github.com/basemind-ai/monorepo/shared/go/grpcutils"
	loggingMiddleware "github.com/grpc-ecosystem/go-grpc-middleware/v2/interceptors/logging"
	"github.com/rs/zerolog/log"
	"github.com/stretchr/testify/assert"
	"google.golang.org/grpc"
	"testing"
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
}

package grpcutils

import (
	"context"
	"fmt"

	"github.com/grpc-ecosystem/go-grpc-middleware/v2/interceptors/auth"
	loggingMiddleware "github.com/grpc-ecosystem/go-grpc-middleware/v2/interceptors/logging"
	"github.com/grpc-ecosystem/go-grpc-middleware/v2/interceptors/recovery"
	"github.com/rs/zerolog/log"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func CreateInterceptorLogger(isDebug bool) (loggingMiddleware.Logger, []loggingMiddleware.Option) {
	loggingEvents := []loggingMiddleware.LoggableEvent{
		loggingMiddleware.StartCall, loggingMiddleware.FinishCall,
	}

	if isDebug {
		loggingEvents = append(
			loggingEvents,
			loggingMiddleware.PayloadSent, loggingMiddleware.PayloadReceived,
		)
	}

	loggingOptions := []loggingMiddleware.Option{
		loggingMiddleware.WithLogOnEvents(loggingEvents...),
	}

	handlerFunc := loggingMiddleware.LoggerFunc(func(ctx context.Context, lvl loggingMiddleware.Level, msg string, fields ...any) {
		logger := log.Logger.With().Fields(fields).Logger()

		switch lvl {
		case loggingMiddleware.LevelDebug:
			logger.Debug().Msg(msg)
		case loggingMiddleware.LevelInfo:
			logger.Info().Msg(msg)
		case loggingMiddleware.LevelWarn:
			logger.Warn().Msg(msg)
		case loggingMiddleware.LevelError:
			logger.Error().Msg(msg)
		default:
			panic(fmt.Sprintf("unknown level %v", lvl))
		}
	})

	return handlerFunc, loggingOptions
}

type Options[T any] struct {
	Environment   string
	GrpcRegistrar func(s grpc.ServiceRegistrar, srv T)
	Service       T
	ServiceName   string
	AuthHandler   auth.AuthFunc
}

func RecoveryHandler(p any) (err error) {
	log.Error().Msgf("panic triggered: %v", p)
	return status.Errorf(codes.Unknown, "panic triggered: %v", p)
}

func CreateGRPCServer[T any](opts Options[T]) *grpc.Server {
	serverOpts := make([]grpc.ServerOption, 0)

	if opts.Environment != "test" {
		interceptorLogger, loggingOptions := CreateInterceptorLogger(opts.Environment != "production")

		serverOpts = append(
			serverOpts,
			grpc.ChainUnaryInterceptor(
				loggingMiddleware.UnaryServerInterceptor(interceptorLogger, loggingOptions...),
				auth.UnaryServerInterceptor(opts.AuthHandler),
				recovery.UnaryServerInterceptor(recovery.WithRecoveryHandler(RecoveryHandler)),
			),
			grpc.ChainStreamInterceptor(
				loggingMiddleware.StreamServerInterceptor(interceptorLogger, loggingOptions...),
				auth.StreamServerInterceptor(opts.AuthHandler),
				recovery.StreamServerInterceptor(recovery.WithRecoveryHandler(RecoveryHandler)),
			),
		)
	}
	server := grpc.NewServer(serverOpts...)
	opts.GrpcRegistrar(server, opts.Service)
	return server
}

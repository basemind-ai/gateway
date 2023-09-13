package grpcutils

import (
	"context"
	"fmt"
	loggingMiddleware "github.com/grpc-ecosystem/go-grpc-middleware/v2/interceptors/logging"
	"github.com/rs/zerolog/log"
	"google.golang.org/grpc"
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
	GrpcRegistrar func(s grpc.ServiceRegistrar, srv T)
	Service       T
	IsDebug       bool
}

func CreateGRPCServer[T any](opts Options[T]) *grpc.Server {
	interceptorLogger, loggingOptions := CreateInterceptorLogger(opts.IsDebug)
	server := grpc.NewServer(
		grpc.ChainUnaryInterceptor(
			loggingMiddleware.UnaryServerInterceptor(interceptorLogger, loggingOptions...),
		),
		grpc.ChainStreamInterceptor(
			loggingMiddleware.StreamServerInterceptor(interceptorLogger, loggingOptions...),
		))
	opts.GrpcRegistrar(server, opts.Service)
	return server
}

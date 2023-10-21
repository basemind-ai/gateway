package grpcutils

import (
	"context"
	"fmt"

	"github.com/grpc-ecosystem/go-grpc-middleware/v2/interceptors/auth"
	loggingmiddleware "github.com/grpc-ecosystem/go-grpc-middleware/v2/interceptors/logging"
	"github.com/grpc-ecosystem/go-grpc-middleware/v2/interceptors/recovery"
	"github.com/rs/zerolog/log"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func CreateInterceptorLogger(isDebug bool) (loggingmiddleware.Logger, []loggingmiddleware.Option) {
	loggingEvents := []loggingmiddleware.LoggableEvent{
		loggingmiddleware.StartCall, loggingmiddleware.FinishCall,
	}

	if isDebug {
		loggingEvents = append(
			loggingEvents,
			loggingmiddleware.PayloadSent, loggingmiddleware.PayloadReceived,
		)
	}

	loggingOptions := []loggingmiddleware.Option{
		loggingmiddleware.WithLogOnEvents(loggingEvents...),
	}

	handlerFunc := loggingmiddleware.LoggerFunc(
		func(ctx context.Context, lvl loggingmiddleware.Level, msg string, fields ...any) {
			logger := log.Logger.With().Fields(fields).Logger()

			switch lvl {
			case loggingmiddleware.LevelDebug:
				logger.Debug().Msg(msg)
			case loggingmiddleware.LevelInfo:
				logger.Info().Msg(msg)
			case loggingmiddleware.LevelWarn:
				logger.Warn().Msg(msg)
			case loggingmiddleware.LevelError:
				logger.Error().Msg(msg)
			default:
				panic(fmt.Sprintf("unknown level %v", lvl))
			}
		},
	)

	return handlerFunc, loggingOptions
}

type ServiceRegistrar func(s grpc.ServiceRegistrar)

type Options struct {
	Environment       string
	ServiceRegistrars []ServiceRegistrar
	ServiceName       string
	AuthHandler       auth.AuthFunc
}

func RecoveryHandler(p any) (err error) {
	log.Error().Msgf("panic triggered: %v", p)
	return status.Errorf(codes.Unknown, "panic triggered: %v", p)
}

func CreateGRPCServer(opts Options, serverOpts ...grpc.ServerOption) *grpc.Server {
	if opts.Environment != "test" {
		interceptorLogger, loggingOptions := CreateInterceptorLogger(
			opts.Environment != "production",
		)

		serverOpts = append(
			serverOpts,
			grpc.ChainUnaryInterceptor(
				loggingmiddleware.UnaryServerInterceptor(interceptorLogger, loggingOptions...),
				auth.UnaryServerInterceptor(opts.AuthHandler),
				recovery.UnaryServerInterceptor(recovery.WithRecoveryHandler(RecoveryHandler)),
			),
			grpc.ChainStreamInterceptor(
				loggingmiddleware.StreamServerInterceptor(interceptorLogger, loggingOptions...),
				auth.StreamServerInterceptor(opts.AuthHandler),
				recovery.StreamServerInterceptor(recovery.WithRecoveryHandler(RecoveryHandler)),
			),
		)
	}

	server := grpc.NewServer(serverOpts...) // skipcq: GO-S0902

	for _, registrar := range opts.ServiceRegistrars {
		registrar(server)
	}

	return server
}

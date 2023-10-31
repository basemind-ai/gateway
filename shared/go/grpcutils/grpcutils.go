package grpcutils

import (
	"context"
	"fmt"
	"runtime/debug"

	"github.com/grpc-ecosystem/go-grpc-middleware/v2/interceptors/auth"
	loggingmiddleware "github.com/grpc-ecosystem/go-grpc-middleware/v2/interceptors/logging"
	"github.com/grpc-ecosystem/go-grpc-middleware/v2/interceptors/recovery"
	"github.com/rs/zerolog/log"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// CreateInterceptorLogger creates a logger interceptor for use with grpc middleware.
// uses Zerolog and relies on the global zerolog config.
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

// ServiceRegistrar is a function that registers a service with a grpc server.
type ServiceRegistrar func(s grpc.ServiceRegistrar)

// Options is a struct that contains options for creating a grpc server.
type Options struct {
	// Environment is the current environment. Can be 'testing', 'development' or 'production'
	Environment string
	// ServiceRegistrars is a list of functions that register services with the grpc server.
	ServiceRegistrars []ServiceRegistrar
	// ServiceName is the name of the service. Used for logging.
	ServiceName string
	// AuthHandler is the auth handler function for the service.
	AuthHandler auth.AuthFunc
}

// RecoveryHandler is a handler for the grpc recovery interceptor.
func RecoveryHandler(p any) (err error) {
	log.Error().Bytes("stack", debug.Stack()).Msgf("panic triggered: %v", p)
	return status.Error(codes.Internal, "an internal error occurred")
}

// CreateGRPCServer creates a grpc server with the given options.
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

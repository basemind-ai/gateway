package testutils

import (
	"context"
	"github.com/basemind-ai/monorepo/shared/go/grpcutils"
	"google.golang.org/grpc/credentials/insecure"
	"log"
	"net"
	"testing"

	"google.golang.org/grpc"
	"google.golang.org/grpc/test/bufconn"
)

func CreateTestServer[T any](t *testing.T, grpcRegistrar func(s grpc.ServiceRegistrar, srv T), service T, serverOpts ...grpc.ServerOption) *bufconn.Listener {
	listen := bufconn.Listen(101024 * 1024)
	server := grpcutils.CreateGRPCServer[T](
		grpcutils.Options[T]{
			Environment:   "test",
			Service:       service,
			GrpcRegistrar: grpcRegistrar,
			ServiceName:   "test-service",
		},
		serverOpts...,
	)

	go func() {
		if err := server.Serve(listen); err != nil {
			log.Fatalf("error serving test gRPC server: %v", err)
		}
	}()

	t.Cleanup(func() {
		if closeErr := listen.Close(); closeErr != nil {
			t.Fatalf("error closing test gRPC server: %v", closeErr)
		}
		server.Stop()
	})

	return listen
}

func CreateTestClient[T interface{}](t *testing.T, listen *bufconn.Listener, clientFactory func(cc grpc.ClientConnInterface) T) T {
	conn, dialErr := grpc.DialContext(context.TODO(), "",
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithContextDialer(
			func(context.Context, string) (net.Conn, error) {
				return listen.Dial()
			},
		),
	)

	if dialErr != nil {
		t.Fatalf("error dialing test gRPC server: %v", dialErr)
	}

	return clientFactory(conn)
}

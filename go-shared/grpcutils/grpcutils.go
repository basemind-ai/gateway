package grpcutils

import "google.golang.org/grpc"

func CreateGRPCServer[T interface{}](grpcServer func(s grpc.ServiceRegistrar, srv T), implementation T) *grpc.Server {
	// TODO - handle options here based on config
	server := grpc.NewServer()
	grpcServer(server, implementation)
	return server
}

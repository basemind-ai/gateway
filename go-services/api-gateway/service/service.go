package service

import (
	"context"
	"github.com/basemind-ai/monorepo/gen/go/gateway/v1"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type Server struct {
	gateway.UnimplementedAPIGatewayServiceServer
}

func New() *Server {
	return &Server{}
}

func (*Server) RequestPromptConfig(context.Context, *gateway.PromptConfigRequest) (*gateway.PromptConfigResponse, error) {
	return nil, status.Errorf(codes.Unimplemented, "method RequestPromptConfig not implemented")
}

func (*Server) RequestPrompt(context.Context, *gateway.PromptRequest) (*gateway.PromptResponse, error) {
	return nil, status.Errorf(codes.Unimplemented, "method RequestPrompt not implemented")
}
func (*Server) RequestStreamingPrompt(*gateway.PromptRequest, gateway.APIGatewayService_RequestStreamingPromptServer) error {
	return status.Errorf(codes.Unimplemented, "method RequestStreamingPrompt not implemented")
}

package grpcutils

import (
	"context"
	"fmt"
	"github.com/basemind-ai/monorepo/shared/go/jwtutils"
	"github.com/grpc-ecosystem/go-grpc-middleware/v2/interceptors/auth"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// AuthHandler is an Auth handler function fulfilling the type specified by
// https://github.com/grpc-ecosystem/go-grpc-middleware/blob/main/interceptors/auth/auth.go#L24
type AuthHandler struct {
	jwtSecret string
}

func NewAuthHandler(jwtSecret string) *AuthHandler {
	return &AuthHandler{
		jwtSecret: jwtSecret,
	}
}

func (handler *AuthHandler) HandleAuth(ctx context.Context) (context.Context, error) {
	token, metadataErr := auth.AuthFromMD(ctx, "bearer")
	if metadataErr != nil {
		return nil, fmt.Errorf("failed to get metadata: %w", metadataErr)
	}

	if token == "" {
		return nil, status.Errorf(codes.Unauthenticated, "empty auth token")
	}

	claims, tokenErr := jwtutils.ParseJWT(token, []byte(handler.jwtSecret))
	if tokenErr != nil {
		return nil, status.Errorf(codes.Unauthenticated, "invalid auth token: %v", tokenErr)
	}

	sub, subErr := claims.GetSubject()
	if subErr != nil {
		return nil, status.Errorf(codes.Unauthenticated, "invalid auth token: %v", subErr)
	}

	return context.WithValue(ctx, ApplicationIDContextKey, sub), nil
}

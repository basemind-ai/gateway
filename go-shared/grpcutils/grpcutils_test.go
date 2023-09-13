package grpcutils_test

import (
	"testing"

	"github.com/basemind-ai/monorepo/go-shared/grpcutils"
	"github.com/stretchr/testify/assert"
	"google.golang.org/grpc"
)

func TestGrpcUtils(t *testing.T) {
	t.Run("CreateGRPCServer", func(t *testing.T) {
		assert.NotNil(t, grpcutils.CreateGRPCServer(func(s grpc.ServiceRegistrar, srv interface{}) {}, nil))
	})
}

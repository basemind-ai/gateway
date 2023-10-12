package repositories_test

import (
	"github.com/basemind-ai/monorepo/shared/go/testutils"
	"testing"
)

func TestMain(m *testing.M) {
	cleanup := testutils.CreateNamespaceTestDBModule("repositories-test")
	defer cleanup()
	m.Run()
}

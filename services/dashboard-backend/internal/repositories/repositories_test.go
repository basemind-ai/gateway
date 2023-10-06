package repositories_test

import (
	dbTestUtils "github.com/basemind-ai/monorepo/shared/go/db/testutils"
	"testing"
)

func TestMain(m *testing.M) {
	cleanup := dbTestUtils.CreateNamespaceTestDBModule("repositories-test")
	defer cleanup()
	m.Run()
}

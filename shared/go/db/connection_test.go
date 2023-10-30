package db_test

import (
	"context"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/testutils"
	"github.com/stretchr/testify/assert"
	"testing"
)

func TestMain(m *testing.M) {
	cleanup := testutils.CreateNamespaceTestDBModule("db-test")
	defer cleanup()
	m.Run()
}

func TestConnection(t *testing.T) {
	t.Run("CreateConnection", func(t *testing.T) {
		t.Run("returns connection", func(t *testing.T) {
			p1, e1 := db.CreateConnection(context.TODO(), "")
			assert.NoError(t, e1)
			assert.NotNil(t, p1)

			p2, e2 := db.CreateConnection(context.TODO(), "")
			assert.NoError(t, e2)
			assert.NotNil(t, p2)

			assert.Equal(t, p1, p2)
		})
	})
	t.Run("GetQueries", func(t *testing.T) {
		t.Run("returns queries", func(t *testing.T) {
			q1 := db.GetQueries()
			q2 := db.GetQueries()

			assert.NotNil(t, q1)
			assert.NotNil(t, q2)
			assert.Equal(t, q1, q2)
		})
	})
	t.Run("GetTransaction", func(t *testing.T) {
		t.Run("returns transaction", func(t *testing.T) {
			tx, err := db.GetTransaction(context.TODO())
			assert.NoError(t, err)
			assert.NotNil(t, tx)

			_ = tx.Rollback(context.TODO())
		})
	})
}

package db_test

import (
	"context"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/jackc/pgx/v5"
	"github.com/stretchr/testify/assert"
	"testing"
)

type MockTx struct {
	pgx.Tx
}

func TestUtils(t *testing.T) {
	t.Run("CreateTransactionContext", func(t *testing.T) {
		t.Run("returns context with transaction", func(t *testing.T) {
			mock := MockTx{}
			ctx := db.CreateTransactionContext(context.Background(), &mock)
			returnedTx, err := db.GetOrCreateTx(ctx)
			assert.NoError(t, err)
			assert.Equal(t, &mock, returnedTx)
		})
	})
	t.Run("GetOrCreateTx", func(t *testing.T) {
		t.Run("returns transaction from context", func(t *testing.T) {
			mock := MockTx{}
			ctx := db.CreateTransactionContext(context.Background(), &mock)
			returnedTx, err := db.GetOrCreateTx(ctx)
			assert.NoError(t, err)
			assert.Equal(t, &mock, returnedTx)
		})
		t.Run("returns transaction from db", func(t *testing.T) {
			returnedTx, err := db.GetOrCreateTx(context.TODO())
			assert.NoError(t, err)
			assert.NotNil(t, returnedTx)
			_ = returnedTx.Rollback(context.Background())
		})
	})
	t.Run("CreateShouldCommitContext", func(t *testing.T) {
		t.Run("returns context with should commit", func(t *testing.T) {
			ctx := db.CreateShouldCommitContext(context.Background(), true)
			shouldCommit := db.ShouldCommit(ctx)
			assert.True(t, shouldCommit)
		})
	})
	t.Run("ShouldCommit", func(t *testing.T) {
		t.Run("returns true when should commit is not set", func(t *testing.T) {
			shouldCommit := db.ShouldCommit(context.TODO())
			assert.True(t, shouldCommit)
		})
		t.Run("should return false when should commit is set to false", func(t *testing.T) {
			ctx := db.CreateShouldCommitContext(context.Background(), false)
			shouldCommit := db.ShouldCommit(ctx)
			assert.False(t, shouldCommit)
		})
	})
}

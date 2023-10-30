package db_test

import (
	"context"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
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
			ctx := db.CreateTransactionContext(context.TODO(), &mock)
			returnedTx, err := db.GetOrCreateTx(ctx)
			assert.NoError(t, err)
			assert.Equal(t, &mock, returnedTx)
		})
	})
	t.Run("GetOrCreateTx", func(t *testing.T) {
		t.Run("returns transaction from context", func(t *testing.T) {
			mock := MockTx{}
			ctx := db.CreateTransactionContext(context.TODO(), &mock)
			returnedTx, err := db.GetOrCreateTx(ctx)
			assert.NoError(t, err)
			assert.Equal(t, &mock, returnedTx)
		})
		t.Run("returns transaction from db", func(t *testing.T) {
			returnedTx, err := db.GetOrCreateTx(context.TODO())
			assert.NoError(t, err)
			assert.NotNil(t, returnedTx)
			_ = returnedTx.Rollback(context.TODO())
		})
	})
	t.Run("CreateShouldCommitContext", func(t *testing.T) {
		t.Run("returns context with should commit", func(t *testing.T) {
			ctx := db.CreateShouldCommitContext(context.TODO(), true)
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
			ctx := db.CreateShouldCommitContext(context.TODO(), false)
			shouldCommit := db.ShouldCommit(ctx)
			assert.False(t, shouldCommit)
		})
	})
	t.Run("NumericToDecimal", func(t *testing.T) {
		t.Run("returns decimal.Decimal from pgtype.Numeric", func(t *testing.T) {
			numeric, err := db.StringToNumeric("1.234")
			assert.NoError(t, err)
			decimal, err := db.NumericToDecimal(*numeric)
			assert.NoError(t, err)
			assert.Equal(t, decimal.String(), "1.234")
		})
		t.Run("returns error when pgtype.Numeric is invalid", func(t *testing.T) {
			numeric := pgtype.Numeric{Valid: false}
			_, err := db.NumericToDecimal(numeric)
			assert.Error(t, err)
		})
	})
	t.Run("StringToNumeric", func(t *testing.T) {
		t.Run("returns pgtype.Numeric from string", func(t *testing.T) {
			numeric, err := db.StringToNumeric("1.234")
			assert.NoError(t, err)
			value, _ := numeric.MarshalJSON()
			assert.Equal(t, string(value), "1.234")
		})
		t.Run("returns error when string is invalid", func(t *testing.T) {
			_, err := db.StringToNumeric("invalid")
			assert.Error(t, err)
		})
	})
}

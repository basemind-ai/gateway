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
	t.Run("CommitIfShouldCommit", func(t *testing.T) {
		t.Run("commits transaction when should commit is true", func(t *testing.T) {
			tx, _ := db.GetTransaction(context.TODO())
			ctx := db.CreateShouldCommitContext(context.TODO(), true)
			assert.NotPanics(t, func() {
				db.CommitIfShouldCommit(ctx, tx)
			})
			assert.Error(t, tx.Commit(context.TODO()))
		})
		t.Run("does not commit transaction when should commit is false", func(t *testing.T) {
			tx, _ := db.GetTransaction(context.TODO())
			ctx := db.CreateShouldCommitContext(context.TODO(), false)
			assert.NotPanics(t, func() {
				db.CommitIfShouldCommit(ctx, tx)
			})
			assert.NoError(t, tx.Commit(context.TODO()))
		})
	})
	t.Run("StringToUUID", func(t *testing.T) {
		t.Run("returns pgtype.UUID from string", func(t *testing.T) {
			uuidString := "d55028b9-3502-43db-be3e-0a758afa44a7"
			uuid, err := db.StringToUUID(uuidString)
			assert.NoError(t, err)
			assert.True(t, uuid.Valid)
		})

		t.Run("returns error for invalid string", func(t *testing.T) {
			uuid, err := db.StringToUUID("invalid")
			assert.Error(t, err)
			assert.Nil(t, uuid)
		})
	})
	t.Run("UUIDToString", func(t *testing.T) {
		t.Run("returns string from pgtype.UUID", func(t *testing.T) {
			uuidString := "d55028b9-3502-43db-be3e-0a758afa44a7"
			uuid, _ := db.StringToUUID(uuidString)
			assert.Equal(t, db.UUIDToString(uuid), uuidString)
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

	t.Run("HandleRollback", func(t *testing.T) {
		t.Run("rolls back transaction when panic is recovered", func(t *testing.T) {
			tx, _ := db.GetTransaction(context.Background())
			assert.Panics(t, func() {
				defer db.HandleRollback(context.Background(), tx)
				panic("panic")
			})
			assert.Error(t, tx.Commit(context.Background()))
		})
		t.Run("rolls back transaction when no panic is recovered", func(t *testing.T) {
			tx, _ := db.GetTransaction(context.Background())
			assert.NotPanics(t, func() {
				defer db.HandleRollback(context.Background(), tx)
			})
			assert.Error(t, tx.Commit(context.Background()))
		})

		t.Run("does not panic if transaction is closed", func(t *testing.T) {
			tx, _ := db.GetTransaction(context.Background())
			assert.NoError(t, tx.Commit(context.Background()))
			assert.NotPanics(t, func() {
				defer db.HandleRollback(context.Background(), tx)
			})
		})
	})
}

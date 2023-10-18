package db

import (
	"context"
	"fmt"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

type repositoryContextKeyType int

const (
	transactionContextKey repositoryContextKeyType = iota
	shouldCommitContextKey
)

func StringToUUID(value string) (*pgtype.UUID, error) {
	uuid := &pgtype.UUID{}
	if scanErr := uuid.Scan(value); scanErr != nil {
		return nil, scanErr
	}

	return uuid, nil
}

func UUIDToString(value *pgtype.UUID) string {
	return fmt.Sprintf(
		"%x-%x-%x-%x-%x",
		value.Bytes[0:4],
		value.Bytes[4:6],
		value.Bytes[6:8],
		value.Bytes[8:10],
		value.Bytes[10:16],
	)
}

func CreateTransactionContext(ctx context.Context, tx pgx.Tx) context.Context {
	return context.WithValue(
		ctx,
		transactionContextKey,
		tx,
	)
}

func CreateShouldCommitContext(ctx context.Context, shouldCommit bool) context.Context {
	return context.WithValue(
		ctx,
		shouldCommitContextKey,
		shouldCommit,
	)
}

func GetOrCreateTx(ctx context.Context) (pgx.Tx, error) {
	if tx, exists := ctx.Value(transactionContextKey).(pgx.Tx); exists {
		return tx, nil
	}
	return GetTransaction(ctx)
}

func ShouldCommit(ctx context.Context) bool {
	if shouldCommit, exists := ctx.Value(shouldCommitContextKey).(bool); exists {
		return shouldCommit
	}

	return true
}

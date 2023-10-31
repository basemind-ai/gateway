package db

import (
	"context"
	"fmt"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/shopspring/decimal"
)

type repositoryContextKeyType int

const (
	transactionContextKey repositoryContextKeyType = iota
	shouldCommitContextKey
)

// StringToUUID converts a string to a pgtype.UUID.
func StringToUUID(value string) (*pgtype.UUID, error) {
	uuid := &pgtype.UUID{}
	if scanErr := uuid.Scan(value); scanErr != nil {
		return nil, fmt.Errorf("failed to scan uuid value - %w", scanErr)
	}

	return uuid, nil
}

// UUIDToString converts a pgtype.UUID to a string.
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

// NumericToDecimal converts a pgtype.Numeric to a decimal.Decimal.
func NumericToDecimal(value pgtype.Numeric) (*decimal.Decimal, error) {
	b, _ := value.MarshalJSON()
	decimalValue, decimalErr := decimal.NewFromString(string(b))
	if decimalErr != nil {
		return nil, fmt.Errorf("failed to convert numeric value to decimal - %w", decimalErr)
	}

	return &decimalValue, nil
}

// StringToNumeric converts a string to a pgtype.Numeric.
func StringToNumeric(value string) (*pgtype.Numeric, error) {
	numeric := &pgtype.Numeric{}
	if scanErr := numeric.Scan(value); scanErr != nil {
		return nil, fmt.Errorf("failed to scan numeric value - %w", scanErr)
	}

	return numeric, nil
}

// CreateTransactionContext creates a context that has a DB transaction inside it.
func CreateTransactionContext(ctx context.Context, tx pgx.Tx) context.Context {
	return context.WithValue(
		ctx,
		transactionContextKey,
		tx,
	)
}

// CreateShouldCommitContext creates a context that a boolean flag - signifying whether downstream db functions should commit or not.
func CreateShouldCommitContext(ctx context.Context, shouldCommit bool) context.Context {
	return context.WithValue(
		ctx,
		shouldCommitContextKey,
		shouldCommit,
	)
}

// GetOrCreateTx retrieves a transaction from context, if existing, otherwise creates a new transaction.
func GetOrCreateTx(ctx context.Context) (pgx.Tx, error) {
	if tx, exists := ctx.Value(transactionContextKey).(pgx.Tx); exists {
		return tx, nil
	}
	return GetTransaction(ctx)
}

// ShouldCommit checks whether a transaction should commit or not. Defaults to true if the value is not set in context.
func ShouldCommit(ctx context.Context) bool {
	if shouldCommit, exists := ctx.Value(shouldCommitContextKey).(bool); exists {
		return shouldCommit
	}

	return true
}

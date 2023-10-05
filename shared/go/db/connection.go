package db

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/cenkalti/backoff/v4"

	"github.com/jackc/pgx/v5"
	"github.com/rs/zerolog/log"
)

var (
	queries        *Queries
	connectionOnce sync.Once
	queriesOnce    sync.Once
	connection     *pgx.Conn
)

func CreateConnection(ctx context.Context, dbUrl string) (*pgx.Conn, error) {
	var err error

	connectionOnce.Do(func() {
		exponentialBackoff := backoff.NewExponentialBackOff()
		exponentialBackoff.MaxInterval = time.Second * 5
		exponentialBackoff.MaxElapsedTime = 20 * time.Second

		if connErr := backoff.Retry(func() error {
			conn, pgxErr := pgx.Connect(ctx, dbUrl)
			if pgxErr != nil {
				return pgxErr
			}
			connection = conn

			return connection.Ping(ctx)
		}, exponentialBackoff); connErr != nil {
			err = connErr
		}
	})

	return connection, err
}

func GetQueries() *Queries {
	queriesOnce.Do(func() {
		if connection == nil {
			log.Fatal().Msg("Connection not initialized")
		}
		queries = New(connection)
	})

	return queries
}

func GetTransaction(ctx context.Context) (pgx.Tx, error) {
	tx, err := connection.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		log.Error().Err(err).Msg("failed to create transaction")
		return nil, err
	}

	return tx, nil
}

func WithRollback[T any](tx pgx.Tx, query func() (T, error)) (*T, error) {
	result, err := query()
	if err != nil {
		if rollbackErr := tx.Rollback(context.Background()); rollbackErr != nil {
			log.Error().Err(rollbackErr).Msg("failed to rollback transaction")
			return nil, fmt.Errorf("failed to rollback transaction - %w - %w", rollbackErr, err)
		}
	}
	return &result, err
}

package db

import (
	"context"
	"github.com/jackc/pgx/v5/pgxpool"
	"sync"
	"time"

	"github.com/cenkalti/backoff/v4"

	"github.com/jackc/pgx/v5"
	"github.com/rs/zerolog/log"
)

var (
	queries     *Queries
	poolOnce    sync.Once
	queriesOnce sync.Once
	pool        *pgxpool.Pool
)

// CreateConnection - creates a connection to the database.
// This function is idempotent and it has a retry mechanism, ensuring a connection is established.
func CreateConnection(ctx context.Context, dbURL string) (*pgxpool.Pool, error) {
	var err error

	poolOnce.Do(func() {
		exponentialBackoff := backoff.NewExponentialBackOff()
		exponentialBackoff.MaxInterval = time.Second * 5
		exponentialBackoff.MaxElapsedTime = 20 * time.Second

		if connErr := backoff.Retry(func() error {
			conn, pgxErr := pgxpool.New(ctx, dbURL)
			if pgxErr != nil {
				return pgxErr
			}
			pool = conn

			return pool.Ping(ctx)
		}, exponentialBackoff); connErr != nil {
			err = connErr
		}
	})

	return pool, err
}

// GetQueries - returns the queries object.
// Panics if the connection is not initialized.
func GetQueries() *Queries {
	queriesOnce.Do(func() {
		if pool == nil { // skipcq: TCV-001
			log.Fatal().Msg("Connection not initialized")
		}
		queries = New(pool)
	})

	return queries
}

// GetTransaction creates a new transaction.
func GetTransaction(ctx context.Context) (pgx.Tx, error) {
	tx, err := pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		log.Error().Err(err).Msg("failed to create transaction")
		return nil, err
	}

	return tx, nil
}

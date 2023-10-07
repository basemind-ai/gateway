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

func GetQueries() *Queries {
	queriesOnce.Do(func() {
		if pool == nil {
			log.Fatal().Msg("Connection not initialized")
		}
		queries = New(pool)
	})

	return queries
}

func GetTransaction(ctx context.Context) (pgx.Tx, error) {
	tx, err := pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		log.Error().Err(err).Msg("failed to create transaction")
		return nil, err
	}

	return tx, nil
}

package db

import (
	"context"
	"sync"

	"github.com/jackc/pgx/v5"
	"github.com/rs/zerolog/log"
)

var (
	queries        *Queries
	connectionOnce sync.Once
	queriesOnce    sync.Once
	connection     *pgx.Conn
)

func CreateConnection(ctx context.Context, dbUrl string) *pgx.Conn {
	connectionOnce.Do(func() {
		conn, err := pgx.Connect(ctx, dbUrl)
		if err != nil {
			log.Fatal().Err(err).Msg("Unable to connect to database")
		}
		connection = conn
		queries = New(conn)
	})

	return connection
}

func GetQueries() *Queries {
	if connection == nil {
		log.Fatal().Msg("Connection not initialized")
	}

	queriesOnce.Do(func() {
		queries = New(connection)
	})
	return queries
}

func SetConnection(conn *pgx.Conn) {
	connection = conn
}

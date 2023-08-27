package testutils

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"github.com/basemind-ai/monorepo/go-shared/db"
	"os/exec"

	"github.com/rs/zerolog/log"
	"os"
	"testing"
	"time"

	_ "github.com/lib/pq"
	"github.com/ory/dockertest/v3"
	"github.com/ory/dockertest/v3/docker"
)

func TestMainWrapper(m *testing.M) {
	// uses a sensible default on windows (tcp/http) and linux/osx (socket)
	pool, err := dockertest.NewPool("")
	if err != nil {
		log.Fatal().Err(err).Msgf("Could not construct pool: %s", err)
	}

	err = pool.Client.Ping()
	if err != nil {
		log.Fatal().Err(err).Msgf("Could not connect to Docker: %s", err)
	}

	// pulls an image, creates a container based on it and runs it
	resource, err := pool.RunWithOptions(&dockertest.RunOptions{
		Repository: "postgres",
		Tag:        "latest",
		Env: []string{
			"POSTGRES_PASSWORD=secret",
			"POSTGRES_USER=user_name",
			"POSTGRES_DB=dbname",
			"listen_addresses = '*'",
		},
	}, func(config *docker.HostConfig) {
		// set AutoRemove to true so that stopped container goes away by itself
		config.AutoRemove = true
		config.RestartPolicy = docker.RestartPolicy{Name: "no"}
	})
	if err != nil {
		log.Fatal().Err(err).Msgf("Could not start resource: %s", err)
	}

	hostAndPort := resource.GetHostPort("5432/tcp")
	databaseUrl := fmt.Sprintf("postgresql://user_name:secret@%s/dbname?sslmode=disable", hostAndPort)

	log.Info().Msgf("Connecting to database on url: %s", databaseUrl)

	resource.Expire(120) // Tell docker to hard kill the container in 120 seconds

	// exponential backoff-retry, because the application in the container might not be ready to accept connections yet
	pool.MaxWait = 120 * time.Second
	if err = pool.Retry(func() error {

		tmpDb, err := sql.Open("postgres", databaseUrl)
		if err != nil {
			return err
		}
		return tmpDb.Ping()
	}); err != nil {
		log.Fatal().Err(err).Msgf("Could not connect to docker: %s", err)
	}

	localContext := context.TODO()
	conn := db.CreateConnection(localContext, databaseUrl)
	err = conn.Ping(localContext)
	if err != nil {
		log.Fatal().Err(err).Msgf("Could not connect to docker: %s", err)
	}

	// Migrating DB
	//migrationDatabaseUrl := fmt.Sprintf("postgres://user_name:secret@%s/dbname?sslmode=disable", hostAndPort)

	if err := runMigrations("../../../sql/migrations", "postgres://basemind:basemind@localhost:5432/basemind"); err != nil {
		log.Fatal().Err(err).Msgf("Could not migrate db: %s", err)
	}

	//Run tests
	code := m.Run()

	// You can't defer this because os.Exit doesn't care for defer
	if err := pool.Purge(resource); err != nil {
		log.Fatal().Err(err).Msgf("Could not purge resource: %s", err)
	}

	os.Exit(code)
}

func runMigrations(migrationsPath string, connUrl string) error {
	if migrationsPath == "" {
		return errors.New("missing migrations path")
	}

	out, err := exec.Command("atlas", "migrate", "apply", "--dir", "file://"+migrationsPath, "--url", connUrl).Output()

	log.Info().Msg(string(out))
	if err != nil {
		return err
	}

	return nil
}

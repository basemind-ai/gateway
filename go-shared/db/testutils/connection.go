package testutils

import (
	"context"
	"fmt"
	"os/exec"
	"testing"

	"github.com/rs/zerolog/log"

	"github.com/ory/dockertest/v3"
	"github.com/ory/dockertest/v3/docker"

	"github.com/basemind-ai/monorepo/go-shared/db"
)

func CreateTestDB(t *testing.T) {
	connectionPool, poolInitErr := dockertest.NewPool("")
	if poolInitErr != nil {
		log.Fatal().Err(poolInitErr).Msg("failed to construct dockertest pool")
	}

	if poolErr := connectionPool.Client.Ping(); poolErr != nil {
		log.Fatal().Err(poolErr).Msg("failed to connect to docker daemon")
	}

	opts := &dockertest.RunOptions{
		Repository: "postgres",
		Tag:        "latest",
		Env: []string{
			"POSTGRES_PASSWORD=test",
			"POSTGRES_USER=test",
			"POSTGRES_DB=test",
			"listen_addresses = '*'",
		},
	}

	resource, dockerErr := connectionPool.RunWithOptions(opts, func(config *docker.HostConfig) {
		config.AutoRemove = true
		config.RestartPolicy = docker.RestartPolicy{Name: "no"}
	})

	if dockerErr != nil {
		log.Fatal().Err(dockerErr).Msg("failed to start docker container")
	}

	_ = resource.Expire(120)

	dbUrl := fmt.Sprintf("postgres://test:test@%s/test?sslmode=disable", resource.GetHostPort("5432/tcp"))

	connection, connectionErr := db.CreateConnection(context.TODO(), dbUrl)
	if connectionErr != nil {
		log.Fatal().Err(connectionErr).Msg("failed to connect to test database")
	}

	cmd := exec.Command(
		"atlas",
		"migrate",
		"apply",
		"--url",
		dbUrl,
		"--dir",
		"file://../../../sql/migrations",
	)

	if _, migrationCommandErr := cmd.Output(); migrationCommandErr != nil {
		log.Fatal().Err(migrationCommandErr).Msg("failed to migrate the test database")
	}

	t.Cleanup(func() {
		_ = connection.Close(context.TODO())
		if purgeErr := connectionPool.Purge(resource); purgeErr != nil {
			log.Fatal().Err(purgeErr).Msg("failed to purge test database")
		}
	})
}

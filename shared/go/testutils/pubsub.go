package testutils

import (
	"context"
	"github.com/basemind-ai/monorepo/shared/go/exc"
	"github.com/rs/zerolog/log"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/wait"
	"testing"
)

// CreatePubsubTestContainer - creates a test container for the gcloud pubsub emulator.
// The pubsub SDK checks for the PUBSUB_EMULATOR_HOST environment variable and uses it if it exists.
// So all that is required to execute pubsub in tests is to run this function.
func CreatePubsubTestContainer(t *testing.T, env ...map[string]string) {
	t.Helper()
	environment := map[string]string{}
	if len(env) > 0 {
		environment = env[0]
	}

	environment["TESTCONTAINERS_HOST_OVERRIDE"] = "host.docker.internal"

	container, err := testcontainers.GenericContainer(
		context.TODO(),
		testcontainers.GenericContainerRequest{
			ContainerRequest: testcontainers.ContainerRequest{
				// see: https://hub.docker.com/r/thekevjames/gcloud-pubsub-emulator
				Image:        "thekevjames/gcloud-pubsub-emulator:406.0.0",
				ExposedPorts: []string{"8681/tcp"},
				WaitingFor:   wait.ForListeningPort("8681/tcp"),
				Env:          environment,
			},
			Started: true,
		},
	)

	if err != nil {
		log.Fatal().Err(err).Msg("Failed to create pubsub test container")
	}

	endpoint := exc.MustResult(container.Endpoint(context.TODO(), ""))
	t.Setenv("PUBSUB_EMULATOR_HOST", endpoint)

	t.Cleanup(func() {
		exc.LogIfErr(container.Terminate(context.TODO()))
	})
}

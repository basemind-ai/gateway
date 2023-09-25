package cmd

import (
	"fmt"
	"github.com/basemind-ai/monorepo/e2e/factories"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/rs/zerolog/log"

	"github.com/spf13/cobra"
)

func init() {
	rootCmd.AddCommand(seedCommand)
}

var seedCommand = &cobra.Command{
	Use:   "seed",
	Short: "Seeds the database with test data",
	Long:  `Execute this command to insert test data into the DB`,
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println("creating db connection")

		conn, connErr := db.CreateConnection(cmd.Context(), dbUrl)
		if connErr != nil {
			log.Fatal().Err(connErr).Msg("failed to connect to DB")
		}

		defer func() {
			if err := conn.Close(cmd.Context()); err != nil {
				log.Fatal().Err(err).Msg("failed to close DB connection")
			}
		}()

		promptConfig, applicationId := factories.CreateApplicationPromptConfig(cmd.Context())

		log.Info().Str("applicationId", applicationId).Msg("created application")
		log.Info().Interface("promptConfig", promptConfig).Msg("created prompt config")

	},
}

package cmd

import (
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
		log.Info().Msg("creating db connection")

		conn, connErr := db.CreateConnection(cmd.Context(), dbURL)
		if connErr != nil {
			log.Fatal().Err(connErr).Msg("failed to connect to DB")
		}

		defer conn.Close()

		project, projectCreateErr := factories.CreateProject(cmd.Context())
		if projectCreateErr != nil {
			log.Fatal().Err(projectCreateErr).Msg("failed to create project")
		}
		log.Info().Interface("project", project).Msg("created project")

		application, applicationCreateErr := factories.CreateApplication(cmd.Context(), project.ID)
		if applicationCreateErr != nil {
			log.Fatal().Err(applicationCreateErr).Msg("failed to create application")
		}
		log.Info().Interface("application", application).Msg("created application")

		promptConfig, promptConfigCreateErr := factories.CreateOpenAIPromptConfig(
			cmd.Context(),
			application.ID,
		)
		if promptConfigCreateErr != nil {
			log.Fatal().Err(promptConfigCreateErr).Msg("failed to create application prompt config")
		}
		log.Info().Interface("promptConfig", promptConfig).Msg("created prompt config")

		providerPricingModelErr := factories.CreateProviderPricingModels(cmd.Context())
		if providerPricingModelErr != nil {
			log.Fatal().Err(providerPricingModelErr).Msg("failed to create provider pricing models")
		}

		apiKey, apiKeyCreateErr := factories.CreateApplicationInternalAPIKey(
			cmd.Context(),
			application.ID,
		)
		if apiKeyCreateErr != nil {
			log.Fatal().Err(apiKeyCreateErr).Msg("failed to create application internal apiKey")
		}
		log.Info().Interface("apiKey", apiKey).Msg("created apiKey")
	},
}

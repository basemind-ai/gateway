package cmd

import (
	"errors"
	"github.com/basemind-ai/monorepo/shared/go/jwtutils"
	"github.com/rs/zerolog/log"
	"time"

	"github.com/spf13/cobra"
)

func init() {
	rootCmd.AddCommand(createJwt)
}

var createJwt = &cobra.Command{
	Use:   "create-jwt [flags] {applicationId}",
	Short: "Creates a JWT token",
	Long:  `Creates a JWT token from the passed in applicationId`,
	Args: func(cmd *cobra.Command, args []string) error {
		if len(args) < 1 {
			return errors.New("an applicationId arg is required")
		}
		return nil
	},
	Run: func(cmd *cobra.Command, args []string) {
		jwt, createErr := jwtutils.CreateJWT(time.Hour, []byte(secret), args[0])
		if createErr != nil {
			log.Fatal().Err(createErr).Msg("failed to create JWT")
		}
		log.Info().Str("jwt", jwt).Msg("created JWT token")
	},
}

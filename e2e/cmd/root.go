package cmd

import (
	"github.com/basemind-ai/monorepo/shared/go/logging"
	"os"

	"github.com/spf13/cobra"
)

// rootCmd represents the base command when called without any subcommands
var rootCmd = &cobra.Command{
	Use:   "e2e",
	Short: "E2E testing CLI",
	Long:  `CLI tool for executing E2E test`,
}

var dbUrl string

// Execute adds all child commands to the root command and sets flags appropriately.
// This is called by main.main(). It only needs to happen once to the rootCmd.
func Execute() {
	err := rootCmd.Execute()
	if err != nil {
		os.Exit(1)
	}
}

func init() {
	logging.Configure(true)

	// global flags
	rootCmd.PersistentFlags().StringVar(&dbUrl, "dbUrl", "postgresql://basemind:basemind@localhost:5432/basemind", "the url of the DB to use")

}

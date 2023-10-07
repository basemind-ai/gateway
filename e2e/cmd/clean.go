package cmd

import (
	"fmt"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/rs/zerolog/log"
	"strings"

	"github.com/spf13/cobra"
)

func init() {
	rootCmd.AddCommand(cleanCommand)
}

var cleanCommand = &cobra.Command{
	Use:   "clean",
	Short: "Cleans the local database",
	Long:  `Execute this command to clean the local database`,
	Run: func(cmd *cobra.Command, args []string) {
		log.Info().Msg("creating db connection")

		conn, connErr := db.CreateConnection(cmd.Context(), dbURL)
		if connErr != nil {
			log.Fatal().Err(connErr).Msg("failed to connect to DB")
		}

		defer conn.Close()

		rows, queryErr := conn.Query(
			cmd.Context(),
			"SELECT schemaname, tablename FROM pg_catalog.pg_tables",
		)
		if queryErr != nil {
			log.Fatal().Err(queryErr).Msg("failed to query tables from DB")
		}

		defer rows.Close()

		var tables []string
		for rows.Next() {
			schemaName := ""
			tableName := ""
			if scanErr := rows.Scan(&schemaName, &tableName); scanErr != nil {
				log.Fatal().Err(scanErr).Msg("failed to scan row")
			}
			if schemaName == "public" && !strings.Contains(tableName, "atlas") {
				tables = append(tables, fmt.Sprintf("\"%s\"", tableName))
			}
		}
		log.Info().Interface("rows", tables).Msg("cleaning the following tables")
		if _, execErr := conn.Exec(cmd.Context(), fmt.Sprintf("TRUNCATE %v CASCADE;", strings.Join(tables, ", "))); execErr != nil {
			log.Fatal().Err(execErr).Msg("failed to truncate tables")
		}
		log.Info().Msg("cleaned tables")
	},
}

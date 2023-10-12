package repositories

import (
	"context"
	"time"

	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/jackc/pgx/v5/pgtype"
)

func GetPromptRequestCountByDateRange(ctx context.Context, applicationID pgtype.UUID, fromDate, toDate time.Time) (int64, error) {
	promptReqParam := db.RetrieveTotalPromptRequestRecordParams{
		ApplicationID: applicationID,
		FromDate:      pgtype.Timestamptz{Time: fromDate, Valid: true},
		ToDate:        pgtype.Timestamptz{Time: toDate, Valid: true},
	}

	totalRequests, dbErr := db.GetQueries().RetrieveTotalPromptRequestRecord(ctx, promptReqParam)
	if dbErr != nil {
		return -1, dbErr
	}

	return totalRequests, nil
}

func GetTokenUsagePerModelTypeByDateRange(ctx context.Context, applicationID pgtype.UUID, fromDate, toDate time.Time) (map[db.ModelType]int64, error) {
	promptReqParam := db.RetrieveTotalPromptRequestRecordParams{
		ApplicationID: applicationID,
		FromDate:      pgtype.Timestamptz{Time: fromDate, Valid: true},
		ToDate:        pgtype.Timestamptz{Time: toDate, Valid: true},
	}

	recordPerPromptConfig, dbErr := db.GetQueries().RetrieveTotalTokensPerPromptConfig(ctx, promptReqParam)
	if dbErr != nil {
		return nil, dbErr
	}

	tokenCntMap := make(map[db.ModelType]int64)
	for _, record := range recordPerPromptConfig {
		tokenCntMap[record.ModelType] += record.TotalTokens
	}

	return tokenCntMap, nil
}

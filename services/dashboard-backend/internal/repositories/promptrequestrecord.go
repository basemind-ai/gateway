package repositories

import (
	"context"
	"time"

	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/dto"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/tokenutils"
	"github.com/jackc/pgx/v5/pgtype"
)

func GetPromptRequestAnalyticsByDateRange(ctx context.Context, applicationID pgtype.UUID, fromDate, toDate time.Time) (dto.ApplicationAnalyticsDTO, error) {
	totalRequests, dbErr := GetPromptRequestCountByDateRange(ctx, applicationID, fromDate, toDate)
	if dbErr != nil {
		return dto.ApplicationAnalyticsDTO{}, dbErr
	}

	tokenCntMap, dbErr := GetTokenUsagePerModelTypeByDateRange(ctx, applicationID, fromDate, toDate)
	if dbErr != nil {
		return dto.ApplicationAnalyticsDTO{}, dbErr
	}

	var totalCost float64
	for model, tokenCnt := range tokenCntMap {
		totalCost += tokenutils.GetCostByModelType(tokenCnt, model)
	}

	return dto.ApplicationAnalyticsDTO{
		TotalRequests: totalRequests,
		ProjectedCost: totalCost,
	}, nil
}

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

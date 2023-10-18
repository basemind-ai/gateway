package repositories

import (
	"context"
	"fmt"
	"time"

	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/dto"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/tokenutils"
	"github.com/jackc/pgx/v5/pgtype"
)

func GetPromptRequestAnalyticsByDateRange(
	ctx context.Context,
	applicationID pgtype.UUID,
	fromDate, toDate time.Time,
) (dto.ApplicationAnalyticsDTO, error) {
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

func GetPromptRequestCountByDateRange(
	ctx context.Context,
	applicationID pgtype.UUID,
	fromDate, toDate time.Time,
) (int64, error) {
	totalRequests, dbErr := db.GetQueries().RetrieveApplicationAPIRequestCount(
		ctx,
		db.RetrieveApplicationAPIRequestCountParams{
			ID:          applicationID,
			CreatedAt:   pgtype.Timestamptz{Time: fromDate, Valid: true},
			CreatedAt_2: pgtype.Timestamptz{Time: toDate, Valid: true},
		},
	)
	if dbErr != nil {
		return -1, fmt.Errorf("failed to retrieve total prompt request records: %w", dbErr)
	}

	return totalRequests, nil
}

func GetTokenUsagePerModelTypeByDateRange(
	ctx context.Context,
	applicationID pgtype.UUID,
	fromDate, toDate time.Time,
) (map[db.ModelType]int64, error) {
	recordPerPromptConfig, dbErr := db.GetQueries().RetrieveApplicationTokensCount(
		ctx,
		db.RetrieveApplicationTokensCountParams{
			ID:          applicationID,
			CreatedAt:   pgtype.Timestamptz{Time: fromDate, Valid: true},
			CreatedAt_2: pgtype.Timestamptz{Time: toDate, Valid: true},
		},
	)
	if dbErr != nil {
		return nil, fmt.Errorf("failed to retrieve total tokens per prompt config: %w", dbErr)
	}

	tokenCntMap := make(map[db.ModelType]int64)
	for _, record := range recordPerPromptConfig {
		tokenCntMap[record.ModelType] += record.TotalTokens
	}

	return tokenCntMap, nil
}

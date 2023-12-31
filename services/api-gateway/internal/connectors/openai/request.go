package openai

import (
	"context"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/dto"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/utils"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/db/models"
	"github.com/basemind-ai/monorepo/shared/go/exc"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/rs/zerolog/log"
	"time"
)

// RequestPrompt sends a prompt request to the OpenAI API connector.
func (c *Client) RequestPrompt(
	ctx context.Context,
	requestConfiguration *dto.RequestConfigurationDTO,
	templateVariables map[string]string,
) dto.PromptResultDTO {
	promptRequest, createPromptRequestErr := CreatePromptRequest(
		requestConfiguration,
		templateVariables,
	)
	if createPromptRequestErr != nil {
		return dto.PromptResultDTO{Error: createPromptRequestErr}
	}

	modelPricingID := exc.MustResult(db.StringToUUID(requestConfiguration.ProviderModelPricing.ID))

	recordParams := models.CreatePromptRequestRecordParams{
		PromptConfigID:         requestConfiguration.PromptConfigID,
		IsStreamResponse:       false,
		StartTime:              pgtype.Timestamptz{Time: time.Now(), Valid: true},
		ProviderModelPricingID: *modelPricingID,
	}
	promptResult := dto.PromptResultDTO{}

	response, requestErr := c.client.OpenAIPrompt(ctx, promptRequest)
	recordParams.FinishTime = pgtype.Timestamptz{Time: time.Now(), Valid: true}

	if requestErr == nil {
		promptResult.Content = &response.Content
		recordParams.FinishReason = models.PromptFinishReason(response.FinishReason)

		recordParams.RequestTokens = int32(response.RequestTokensCount)
		recordParams.ResponseTokens = int32(response.ResponseTokensCount)

		costs := utils.CalculateCosts(
			recordParams.RequestTokens,
			recordParams.ResponseTokens,
			requestConfiguration.ProviderModelPricing,
		)
		recordParams.RequestTokensCost = *exc.MustResult(db.StringToNumeric(costs.RequestTokenCost.String()))
		recordParams.ResponseTokensCost = *exc.MustResult(db.StringToNumeric(costs.RequestTokenCost.String()))
	} else {
		log.Debug().Err(requestErr).Msg("request error")
		promptResult.Error = requestErr
		recordParams.ErrorLog = pgtype.Text{String: requestErr.Error(), Valid: true}
	}

	requestRecord, createRequestRecordErr := db.
		GetQueries().
		CreatePromptRequestRecord(
			ctx,
			recordParams,
		)

	if promptResult.Error == nil {
		promptResult.Error = createRequestRecordErr
	}

	promptResult.RequestRecord = &requestRecord

	return promptResult
}

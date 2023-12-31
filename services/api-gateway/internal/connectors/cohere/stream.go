package cohere

import (
	"context"
	cohereconnector "github.com/basemind-ai/monorepo/gen/go/cohere/v1"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/dto"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/utils"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/db/models"
	"github.com/basemind-ai/monorepo/shared/go/exc"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/rs/zerolog/log"
	"time"
)

func parseMessage(msg *cohereconnector.CohereStreamResponse) *utils.StreamMessage {
	return &utils.StreamMessage{
		Content:            msg.Content,
		FinishReason:       msg.FinishReason,
		RequestTokenCount:  msg.RequestTokensCount,
		ResponseTokenCount: msg.ResponseTokensCount,
	}
}

func (c *Client) RequestStream(
	ctx context.Context,
	requestConfiguration *dto.RequestConfigurationDTO,
	templateVariables map[string]string,
	channel chan<- dto.PromptResultDTO,
) {
	promptRequest, promptRequestErr := CreatePromptRequest(
		requestConfiguration,
		templateVariables,
	)
	if promptRequestErr != nil {
		log.Error().Err(promptRequestErr).Msg("failed to create prompt request")
		channel <- dto.PromptResultDTO{Error: promptRequestErr}
		close(channel)

		return
	}

	startTime := time.Now()

	modelPricingID := exc.MustResult(db.StringToUUID(requestConfiguration.ProviderModelPricing.ID))

	recordParams := &models.CreatePromptRequestRecordParams{
		PromptConfigID:         requestConfiguration.PromptConfigID,
		IsStreamResponse:       true,
		StartTime:              pgtype.Timestamptz{Time: startTime, Valid: true},
		ProviderModelPricingID: *modelPricingID,
	}
	finalResult := &dto.PromptResultDTO{}

	stream, streamErr := c.client.CohereStream(ctx, promptRequest)
	finalResult.Error = streamErr

	if streamErr == nil {
		streamFinish := utils.StreamFromClient[cohereconnector.CohereStreamResponse](
			channel,
			finalResult,
			recordParams,
			startTime,
			stream,
			parseMessage,
		)

		recordParams.FinishReason = streamFinish.FinishReason

		recordParams.RequestTokens = int32(streamFinish.RequestTokenCount)
		recordParams.ResponseTokens = int32(streamFinish.ResponseTokenCount)

		costs := utils.CalculateCosts(
			recordParams.RequestTokens,
			recordParams.ResponseTokens,
			requestConfiguration.ProviderModelPricing,
		)
		recordParams.RequestTokensCost = *exc.MustResult(db.StringToNumeric(costs.RequestTokenCost.String()))
		recordParams.ResponseTokensCost = *exc.MustResult(db.StringToNumeric(costs.RequestTokenCost.String()))
	}

	if finalResult.Error != nil {
		recordParams.ErrorLog = pgtype.Text{String: finalResult.Error.Error(), Valid: true}
	}

	promptRecord, createRequestRecordErr := db.GetQueries().
		CreatePromptRequestRecord(
			ctx,
			*recordParams,
		)

	if finalResult.Error == nil {
		finalResult.Error = createRequestRecordErr
	}

	finalResult.RequestRecord = &promptRecord

	channel <- *finalResult
	close(channel)
}

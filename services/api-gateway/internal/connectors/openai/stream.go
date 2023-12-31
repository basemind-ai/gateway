package openai

import (
	"context"
	openaiconnector "github.com/basemind-ai/monorepo/gen/go/openai/v1"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/dto"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/utils"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/db/models"
	"github.com/basemind-ai/monorepo/shared/go/exc"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/rs/zerolog/log"
	"time"
)

func parseMessage(msg *openaiconnector.OpenAIStreamResponse) string { return msg.Content }

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

	stream, streamErr := c.client.OpenAIStream(ctx, promptRequest)
	finalResult.Error = streamErr

	if streamErr == nil {
		promptContent := utils.StreamFromClient[openaiconnector.OpenAIStreamResponse](
			channel,
			finalResult,
			recordParams,
			startTime,
			stream,
			parseMessage,
		)
		tokenCountAndCost := CalculateTokenCountsAndCosts(
			GetRequestPromptString(promptRequest.Messages),
			promptContent,
			requestConfiguration.ProviderModelPricing,
			requestConfiguration.PromptConfigData.ModelType,
		)
		recordParams.RequestTokens = tokenCountAndCost.RequestTokenCount
		recordParams.ResponseTokens = tokenCountAndCost.ResponseTokenCount

		requestTokenCost := exc.MustResult(
			db.StringToNumeric(tokenCountAndCost.RequestTokenCost.String()),
		)
		recordParams.RequestTokensCost = *requestTokenCost

		responseTokenCost := exc.MustResult(
			db.StringToNumeric(tokenCountAndCost.ResponseTokenCost.String()),
		)
		recordParams.ResponseTokensCost = *responseTokenCost
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

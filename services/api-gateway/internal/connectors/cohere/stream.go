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

func parseMessage(msg *cohereconnector.CohereStreamResponse) string {
	content := ""

	if msg != nil {
		content = *msg.Content
	}

	return content
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
		// TODO: implement token cost, until then result is unused
		_ = utils.StreamFromClient[cohereconnector.CohereStreamResponse](
			channel,
			finalResult,
			recordParams,
			startTime,
			stream,
			parseMessage,
		)

		recordParams.RequestTokens = int32(response.RequestTokensCount)
		recordParams.ResponseTokens = int32(response.ResponseTokensCount)
		recordParams.RequestTokensCost = *exc.MustResult(db.StringToNumeric("0.0"))  // TODO: implement token cost
		recordParams.ResponseTokensCost = *exc.MustResult(db.StringToNumeric("0.0")) // TODO: implement token cost
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

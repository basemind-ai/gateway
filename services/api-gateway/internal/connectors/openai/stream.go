package openai

import (
	"context"
	"errors"
	openaiconnector "github.com/basemind-ai/monorepo/gen/go/openai/v1"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/dto"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/db/models"
	"github.com/basemind-ai/monorepo/shared/go/exc"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/rs/zerolog/log"
	"io"
	"strings"
	"time"
)

func streamFromClient(
	channel chan<- dto.PromptResultDTO,
	promptResult *dto.PromptResultDTO,
	recordParams *models.CreatePromptRequestRecordParams,
	startTime time.Time,
	stream openaiconnector.OpenAIService_OpenAIStreamClient,
) string {
	var builder strings.Builder

	for {
		msg, receiveErr := stream.Recv()

		if receiveErr != nil {
			recordParams.FinishTime = pgtype.Timestamptz{Time: time.Now(), Valid: true}

			if !errors.Is(receiveErr, io.EOF) {
				log.Debug().Err(receiveErr).Msg("received stream error")
				promptResult.Error = receiveErr
			}

			break
		}

		if recordParams.DurationMs.Int32 == 0 {
			duration := int32(time.Until(startTime).Milliseconds())
			recordParams.DurationMs = pgtype.Int4{Int32: duration, Valid: true}
		}

		exc.LogIfErr(exc.ReturnAnyErr(builder.WriteString(msg.Content)))
		channel <- dto.PromptResultDTO{Content: &msg.Content}
	}

	return builder.String()
}

func (c *Client) RequestStream(
	ctx context.Context,
	requestConfiguration *dto.RequestConfigurationDTO,
	templateVariables map[string]string,
	channel chan<- dto.PromptResultDTO,
) {
	promptRequest, promptRequestErr := CreatePromptRequest(
		requestConfiguration.ApplicationID,
		requestConfiguration.PromptConfigData.ModelType,
		requestConfiguration.PromptConfigData.ModelParameters,
		requestConfiguration.PromptConfigData.ProviderPromptMessages,
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
		promptContent := streamFromClient(
			channel,
			finalResult,
			recordParams,
			startTime,
			stream,
		)
		tokenCountAndCost := CalculateTokenCountsAndCosts(
			GetRequestPromptString(promptRequest.Messages),
			promptContent,
			requestConfiguration.ProviderModelPricing,
			requestConfiguration.PromptConfigData.ModelType,
		)
		recordParams.RequestTokens = tokenCountAndCost.InputTokenCount
		recordParams.ResponseTokens = tokenCountAndCost.OutputTokenCount

		requestTokenCost := exc.MustResult(
			db.StringToNumeric(tokenCountAndCost.InputTokenCost.String()),
		)
		recordParams.RequestTokensCost = *requestTokenCost

		responseTokenCost := exc.MustResult(
			db.StringToNumeric(tokenCountAndCost.OutputTokenCost.String()),
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

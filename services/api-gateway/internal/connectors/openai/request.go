package openai

import (
	"context"
	"fmt"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/dto"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/tokenutils"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/rs/zerolog/log"
	"time"
)

func (c *Client) RequestPrompt(
	ctx context.Context,
	requestConfiguration *dto.RequestConfigurationDTO,
	templateVariables map[string]string,
) dto.PromptResultDTO {
	promptRequest, createPromptRequestErr := CreatePromptRequest(
		requestConfiguration.ApplicationIDString,
		requestConfiguration.PromptConfigData.ModelType,
		requestConfiguration.PromptConfigData.ModelParameters,
		requestConfiguration.PromptConfigData.ProviderPromptMessages,
		templateVariables,
	)
	if createPromptRequestErr != nil {
		return dto.PromptResultDTO{Error: createPromptRequestErr}
	}

	recordParams := db.CreatePromptRequestRecordParams{
		PromptConfigID:   requestConfiguration.PromptConfigID,
		IsStreamResponse: false,
		StartTime:        pgtype.Timestamptz{Time: time.Now(), Valid: true},
	}
	promptResult := dto.PromptResultDTO{}

	response, requestErr := c.client.OpenAIPrompt(ctx, promptRequest)
	recordParams.FinishTime = pgtype.Timestamptz{Time: time.Now(), Valid: true}

	if requestErr == nil {
		promptResult.Content = &response.Content
		recordParams.RequestTokens = tokenutils.GetPromptTokenCount(
			GetRequestPromptString(promptRequest.Messages),
			requestConfiguration.PromptConfigData.ModelType,
		)
		recordParams.ResponseTokens = tokenutils.GetPromptTokenCount(
			response.Content,
			requestConfiguration.PromptConfigData.ModelType,
		)
	} else {
		log.Debug().Err(requestErr).Msg("request error")
		promptResult.Error = requestErr
		recordParams.ErrorLog = pgtype.Text{String: requestErr.Error(), Valid: true}
	}

	if requestRecord, createRequestRecordErr := db.
		GetQueries().
		CreatePromptRequestRecord(
			ctx,
			recordParams,
		); createRequestRecordErr != nil {
		log.Error().Err(createRequestRecordErr).Msg("failed to create prompt request record")
		if promptResult.Error == nil {
			promptResult.Error = createRequestRecordErr
		} else {
			promptResult.Error = fmt.Errorf(
				"failed to save prompt record: %w...%w",
				promptResult.Error,
				createRequestRecordErr,
			)
		}
	} else {
		promptResult.RequestRecord = &requestRecord
	}

	return promptResult
}

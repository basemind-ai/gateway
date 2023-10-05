package openai

import (
	"context"
	"fmt"
	"github.com/basemind-ai/monorepo/shared/go/datatypes"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/tokenutils"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/rs/zerolog/log"
	"time"
)

func (c *Client) RequestPrompt(
	ctx context.Context,
	applicationId string,
	requestConfiguration *datatypes.RequestConfiguration,
	templateVariables map[string]string,
) datatypes.PromptResult {
	promptRequest, createPromptRequestErr := CreatePromptRequest(
		applicationId,
		requestConfiguration.PromptConfigData.ModelType,
		requestConfiguration.PromptConfigData.ModelParameters,
		requestConfiguration.PromptConfigData.ProviderPromptMessages,
		templateVariables,
	)
	if createPromptRequestErr != nil {
		return datatypes.PromptResult{Error: createPromptRequestErr}
	}

	recordParams := db.CreatePromptRequestRecordParams{
		PromptConfigID:   requestConfiguration.PromptConfigData.ID,
		IsStreamResponse: false,
		StartTime:        pgtype.Timestamptz{Time: time.Now(), Valid: true},
	}
	promptResult := datatypes.PromptResult{}

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

	if requestRecord, createRequestRecordErr := db.GetQueries().CreatePromptRequestRecord(ctx, recordParams); createRequestRecordErr != nil {
		log.Error().Err(createRequestRecordErr).Msg("failed to create prompt request record")
		if promptResult.Error == nil {
			promptResult.Error = createRequestRecordErr
		} else {
			promptResult.Error = fmt.Errorf("failed to save prompt record: %w...%w", promptResult.Error, createRequestRecordErr)
		}
	} else {
		promptResult.RequestRecord = &requestRecord
	}

	return promptResult
}

package cohere

import (
	"context"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/dto"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/db/models"
	"github.com/basemind-ai/monorepo/shared/go/exc"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/rs/zerolog/log"
	"time"
)

// RequestPrompt sends a prompt request to the Cohere API connector.
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

	response, requestErr := c.client.CoherePrompt(ctx, promptRequest)
	recordParams.FinishTime = pgtype.Timestamptz{Time: time.Now(), Valid: true}

	if requestErr == nil {
		promptResult.Content = response.Content

		recordParams.RequestTokens = 0                                               // TODO: implement token cost
		recordParams.ResponseTokens = 0                                              // TODO: implement token cost
		recordParams.RequestTokensCost = *exc.MustResult(db.StringToNumeric("0.0"))  // TODO: implement token cost
		recordParams.ResponseTokensCost = *exc.MustResult(db.StringToNumeric("0.0")) // TODO: implement token cost
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

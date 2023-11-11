package cohere

import (
	"context"
	"fmt"
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

var ModelTypeMap = map[models.ModelType]cohereconnector.CohereModel{
	models.ModelTypeCommand:             cohereconnector.CohereModel_COHERE_MODEL_COMMAND,
	models.ModelTypeCommandLight:        cohereconnector.CohereModel_COHERE_MODEL_COMMAND_LIGHT,
	models.ModelTypeCommandNightly:      cohereconnector.CohereModel_COHERE_MODEL_COMMAND_NIGHTLY,
	models.ModelTypeCommandLightNightly: cohereconnector.CohereModel_COHERE_MODEL_COMMAND_LIGHT_NIGHTLY,
}

func GetModelType(modelType models.ModelType) (*cohereconnector.CohereModel, error) {
	value, ok := ModelTypeMap[modelType]
	if !ok {
		return nil, fmt.Errorf("unknown model type {%s}", modelType)
	}

	return &value, nil
}

func CreatePromptRequest(
	requestConfiguration *dto.RequestConfigurationDTO,
	templateVariables map[string]string,
) (*cohereconnector.CoherePromptRequest, error) {
	model, modelErr := GetModelType(requestConfiguration.PromptConfigData.ModelType)
	if modelErr != nil {
		return nil, modelErr
	}

	promptRequest := &cohereconnector.CoherePromptRequest{
		Model: *model,
	}
}

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
		promptResult.Content = &response.Content

		tokenCountAndCost := utils.CalculateTokenCountsAndCosts(
			promptRequest,
			response.Content,
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

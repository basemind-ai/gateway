package services

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/basemind-ai/monorepo/gen/go/ptesting/v1"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/connectors"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/dto"
	"github.com/basemind-ai/monorepo/shared/go/datatypes"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/db/models"
	"github.com/basemind-ai/monorepo/shared/go/ptr"
	"github.com/rs/zerolog/log"
)

type PromptTestingServer struct {
	ptesting.UnimplementedPromptTestingServiceServer
}

func (PromptTestingServer) TestPrompt(
	request *ptesting.PromptTestRequest,
	streamServer ptesting.PromptTestingService_TestPromptServer,
) error {
	channel := make(chan dto.PromptResultDTO)

	projectID, projectIDParseErr := db.StringToUUID(request.ProjectId)
	if projectIDParseErr != nil {
		return fmt.Errorf("failed to parse project ID: %w", projectIDParseErr)
	}

	applicationID, applicationIDParseErr := db.StringToUUID(request.ApplicationId)
	if applicationIDParseErr != nil {
		return fmt.Errorf("failed to parse application ID: %w", applicationIDParseErr)
	}

	promptConfigID, promptConfigIDParseErr := db.StringToUUID(request.PromptConfigId)
	if promptConfigIDParseErr != nil {
		return fmt.Errorf("failed to parse prompt config ID: %w", promptConfigIDParseErr)
	}

	modelPricing := RetrieveProviderModelPricing(
		streamServer.Context(),
		models.ModelType(request.ModelType),
		models.ModelVendor(request.ModelVendor),
	)

	requestConfigurationDTO := &dto.RequestConfigurationDTO{
		ApplicationID:  *applicationID,
		PromptConfigID: *promptConfigID,
		PromptConfigData: datatypes.PromptConfigDTO{
			ID:                        request.PromptConfigId,
			ModelParameters:           ptr.To(json.RawMessage(request.ModelParameters)),
			ModelType:                 models.ModelType(request.ModelType),
			ModelVendor:               models.ModelVendor(request.ModelVendor),
			ProviderPromptMessages:    ptr.To(json.RawMessage(request.ProviderPromptMessages)),
			ExpectedTemplateVariables: request.ExpectedTemplateVariables,
		},
		ProviderModelPricing: modelPricing,
	}

	providerKeyContext, providerKeyErr := CreateProviderAPIKeyContext(
		streamServer.Context(),
		*projectID,
		requestConfigurationDTO.PromptConfigData.ModelVendor,
	)
	if providerKeyErr != nil {
		log.Error().Err(providerKeyErr).Msg("error creating provider api key context")
		return providerKeyErr
	}

	log.Debug().
		Interface("requestConfigurationDTO", requestConfigurationDTO).
		Msg("initiating stream request")

	go connectors.GetProviderConnector(models.ModelVendor(request.ModelVendor)).
		RequestStream(
			providerKeyContext,
			requestConfigurationDTO,
			request.TemplateVariables,
			channel,
		)

	return StreamFromChannel(
		streamServer.Context(),
		channel,
		streamServer,
		CreatePromptTestingStreamMessage,
	)
}

func CreatePromptTestingStreamMessage(
	ctx context.Context,
	result dto.PromptResultDTO,
) (*ptesting.PromptTestingStreamingPromptResponse, bool) {
	msg := &ptesting.PromptTestingStreamingPromptResponse{}
	if result.Error != nil {
		reason := "error"
		msg.FinishReason = &reason
	}
	if result.RequestRecord != nil {
		if msg.FinishReason == nil {
			reason := "done"
			msg.FinishReason = &reason
		}
		promptRequestRecordID := db.UUIDToString(&result.RequestRecord.ID)
		msg.PromptRequestRecordId = &promptRequestRecordID

		go DeductCredit(ctx, result.RequestRecord)
	}

	if result.Content != nil {
		msg.Content = *result.Content
	}
	return msg, msg.FinishReason != nil
}

package openai

import (
	"context"
	"errors"
	"fmt"
	"io"
	"strings"
	"time"

	"github.com/basemind-ai/monorepo/shared/go/datatypes"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/tokenutils"
	"github.com/jackc/pgx/v5/pgtype"

	openaiconnector "github.com/basemind-ai/monorepo/gen/go/openai/v1"
	"github.com/rs/zerolog/log"
	"google.golang.org/grpc"
)

type Client struct {
	client openaiconnector.OpenAIServiceClient
}

func New(serverAddress string, opts ...grpc.DialOption) (*Client, error) {
	conn, dialErr := grpc.Dial(serverAddress, opts...)
	if dialErr != nil {
		return nil, dialErr
	}

	client := openaiconnector.NewOpenAIServiceClient(conn)
	log.Info().Msg("initialized OpenAI connector")

	return &Client{client: client}, nil
}

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

func (c *Client) RequestStream(
	ctx context.Context,
	applicationId string,
	requestConfiguration *datatypes.RequestConfiguration,
	templateVariables map[string]string,
	channel chan<- datatypes.PromptResult,
) {
	promptRequest, promptRequestErr := CreatePromptRequest(
		applicationId,
		requestConfiguration.PromptConfigData.ModelType,
		requestConfiguration.PromptConfigData.ModelParameters,
		requestConfiguration.PromptConfigData.ProviderPromptMessages,
		templateVariables,
	)
	if promptRequestErr != nil {
		log.Error().Err(promptRequestErr).Msg("failed to create prompt request")
		channel <- datatypes.PromptResult{Error: promptRequestErr}
		close(channel)
		return
	}

	var builder strings.Builder
	startTime := time.Now()

	recordParams := db.CreatePromptRequestRecordParams{
		PromptConfigID:   requestConfiguration.PromptConfigData.ID,
		IsStreamResponse: true,
		StartTime:        pgtype.Timestamptz{Time: startTime, Valid: true},
		RequestTokens: tokenutils.GetPromptTokenCount(
			GetRequestPromptString(promptRequest.Messages),
			requestConfiguration.PromptConfigData.ModelType,
		),
	}
	finalResult := datatypes.PromptResult{}

	if stream, streamErr := c.client.OpenAIStream(ctx, promptRequest); streamErr == nil {
		for {
			if msg, receiveErr := stream.Recv(); receiveErr != nil {
				recordParams.FinishTime = pgtype.Timestamptz{Time: time.Now(), Valid: true}

				if !errors.Is(receiveErr, io.EOF) {
					log.Debug().Err(receiveErr).Msg("received stream error")
					finalResult.Error = receiveErr
				}

				break
			} else {
				if recordParams.StreamResponseLatency.Int64 == 0 {
					duration := int64(time.Until(startTime))
					recordParams.StreamResponseLatency = pgtype.Int8{Int64: duration, Valid: true}
				}

				builder.WriteString(msg.Content)
				channel <- datatypes.PromptResult{Content: &msg.Content}
			}
		}

		recordParams.ResponseTokens = tokenutils.GetPromptTokenCount(
			builder.String(),
			requestConfiguration.PromptConfigData.ModelType,
		)
	} else {
		finalResult.Error = streamErr
	}

	if finalResult.Error != nil {
		recordParams.ErrorLog = pgtype.Text{String: finalResult.Error.Error(), Valid: true}
	}

	if promptRecord, createRequestRecordErr := db.GetQueries().CreatePromptRequestRecord(ctx, recordParams); createRequestRecordErr != nil {
		log.Error().Err(createRequestRecordErr).Msg("failed to create prompt request record")
		if finalResult.Error == nil {
			finalResult.Error = createRequestRecordErr
		} else {
			finalResult.Error = fmt.Errorf("failed to save prompt record: %w...%w", finalResult.Error, createRequestRecordErr)
		}
	} else {
		finalResult.RequestRecord = &promptRecord
	}
	channel <- finalResult
	close(channel)
}

package openai

import (
	"context"
	"errors"
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
		StartTime:        pgtype.Timestamptz{Time: time.Now()},
	}

	var content *string

	response, requestErr := c.client.OpenAIPrompt(ctx, promptRequest)
	recordParams.FinishTime = pgtype.Timestamptz{Time: time.Now()}

	if requestErr == nil {
		content = &response.Content
		recordParams.RequestTokens = tokenutils.GetPromptTokenCount(
			GetRequestPromptString(promptRequest.Messages),
			requestConfiguration.PromptConfigData.ModelType,
		)
		recordParams.ResponseTokens = tokenutils.GetPromptTokenCount(
			response.Content,
			requestConfiguration.PromptConfigData.ModelType,
		)

	} else {
		recordParams.ErrorLog = pgtype.Text{String: requestErr.Error()}
	}

	requestRecord, createRequestRecordErr := db.GetQueries().
		CreatePromptRequestRecord(ctx, recordParams)
	if createRequestRecordErr != nil {
		log.Error().Err(createRequestRecordErr).Msg("failed to create prompt request record")
	}
	return datatypes.PromptResult{Content: content, RequestRecord: &requestRecord}
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
		channel <- datatypes.PromptResult{Error: promptRequestErr}
		close(channel)
		return
	}

	var builder strings.Builder
	startTime := time.Now()

	recordParams := db.CreatePromptRequestRecordParams{
		PromptConfigID:   requestConfiguration.PromptConfigData.ID,
		IsStreamResponse: true,
		StartTime:        pgtype.Timestamptz{Time: startTime},
	}

	stream, streamErr := c.client.OpenAIStream(ctx, promptRequest)
	if streamErr == nil {
		for {
			msg, receiveErr := stream.Recv()

			if recordParams.StreamResponseLatency.Int64 == 0 && receiveErr == nil {
				duration := int64(time.Until(startTime))
				recordParams.StreamResponseLatency = pgtype.Int8{Int64: duration, Valid: true}
			}

			if receiveErr != nil {
				recordParams.FinishTime = pgtype.Timestamptz{Time: time.Now()}

				if !errors.Is(receiveErr, io.EOF) {
					recordParams.ErrorLog = pgtype.Text{String: receiveErr.Error()}
				}

				break
			} else {
				builder.WriteString(msg.Content)
				channel <- datatypes.PromptResult{Content: &msg.Content}
			}
		}
	} else {
		recordParams.ErrorLog = pgtype.Text{String: streamErr.Error()}
	}

	recordParams.RequestTokens = tokenutils.GetPromptTokenCount(
		GetRequestPromptString(promptRequest.Messages),
		requestConfiguration.PromptConfigData.ModelType,
	)
	recordParams.ResponseTokens = tokenutils.GetPromptTokenCount(
		builder.String(),
		requestConfiguration.PromptConfigData.ModelType,
	)

	promptRecord, createRequestRecordErr := db.GetQueries().
		CreatePromptRequestRecord(ctx, recordParams)
	if createRequestRecordErr != nil {
		log.Error().Err(createRequestRecordErr).Msg("failed to create prompt request record")
		channel <- datatypes.PromptResult{Error: createRequestRecordErr}
	} else {
		channel <- datatypes.PromptResult{RequestRecord: &promptRecord}
	}
	close(channel)
}

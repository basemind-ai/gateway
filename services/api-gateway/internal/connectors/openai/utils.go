package openai

import (
	"encoding/json"
	"fmt"
	"github.com/basemind-ai/monorepo/shared/go/datatypes"
	"github.com/basemind-ai/monorepo/shared/go/db/models"
	"github.com/basemind-ai/monorepo/shared/go/exc"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/shopspring/decimal"
	"github.com/tiktoken-go/tokenizer"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"strings"

	"github.com/basemind-ai/monorepo/shared/go/db"

	openaiconnector "github.com/basemind-ai/monorepo/gen/go/openai/v1"
)

var ModelTypeMap = map[models.ModelType]openaiconnector.OpenAIModel{
	models.ModelTypeGpt35Turbo:    openaiconnector.OpenAIModel_OPEN_AI_MODEL_GPT3_5_TURBO_4K,
	models.ModelTypeGpt35Turbo16k: openaiconnector.OpenAIModel_OPEN_AI_MODEL_GPT3_5_TURBO_16K,
	models.ModelTypeGpt4:          openaiconnector.OpenAIModel_OPEN_AI_MODEL_GPT4_8K,
	models.ModelTypeGpt432k:       openaiconnector.OpenAIModel_OPEN_AI_MODEL_GPT4_32K,
}

func GetModelType(modelType models.ModelType) (*openaiconnector.OpenAIModel, error) {
	value, ok := ModelTypeMap[modelType]
	if !ok {
		return nil, fmt.Errorf("unknown model type {%s}", modelType)
	}

	return &value, nil
}

func GetMessageRole(role string) (*openaiconnector.OpenAIMessageRole, error) {
	switch role {
	case "system":
		return openaiconnector.OpenAIMessageRole_OPEN_AI_MESSAGE_ROLE_SYSTEM.Enum(), nil
	case "user":
		return openaiconnector.OpenAIMessageRole_OPEN_AI_MESSAGE_ROLE_USER.Enum(), nil
	case "assistant":
		return openaiconnector.OpenAIMessageRole_OPEN_AI_MESSAGE_ROLE_ASSISTANT.Enum(), nil
	case "function":
		return openaiconnector.OpenAIMessageRole_OPEN_AI_MESSAGE_ROLE_FUNCTION.Enum(), nil
	default:
		return nil, status.Errorf(codes.InvalidArgument, "unknown message role {%s}", role)
	}
}

func ParseTemplateVariables(
	content string,
	expectedVariables []string,
	templateVariables map[string]string,
) (string, error) {
	for _, expectedVariable := range expectedVariables {
		value, ok := templateVariables[expectedVariable]

		if !ok {
			return "", status.Errorf(
				codes.InvalidArgument,
				"missing template variable {%s}",
				expectedVariable,
			)
		}

		content = strings.ReplaceAll(content, fmt.Sprintf("{%s}", expectedVariable), value)
	}

	return content, nil
}

func CreatePromptRequest(
	applicationID pgtype.UUID,
	modelType models.ModelType,
	modelParameters *json.RawMessage,
	promptMessages *json.RawMessage,
	templateVariables map[string]string,
) (*openaiconnector.OpenAIPromptRequest, error) {
	model, modelErr := GetModelType(modelType)
	if modelErr != nil {
		return nil, modelErr
	}

	applicationIDString := db.UUIDToString(&applicationID)

	promptRequest := &openaiconnector.OpenAIPromptRequest{
		Model:         *model,
		ApplicationId: &applicationIDString,
		Parameters:    &openaiconnector.OpenAIModelParameters{},
		Messages:      []*openaiconnector.OpenAIMessage{},
	}

	if parametersUnmarshalErr := json.Unmarshal(
		*modelParameters,
		promptRequest.Parameters,
	); parametersUnmarshalErr != nil {
		return nil, fmt.Errorf("failed to unmarshal model parameters - %w", parametersUnmarshalErr)
	}

	var openAIPromptMessageDTOs []*datatypes.OpenAIPromptMessageDTO
	if messagesUnmarshalErr := json.Unmarshal(*promptMessages, &openAIPromptMessageDTOs); messagesUnmarshalErr != nil {
		return nil, fmt.Errorf("failed to unmarshal prompt messages - %w", messagesUnmarshalErr)
	}

	for _, dto := range openAIPromptMessageDTOs {
		messageRole, roleErr := GetMessageRole(dto.Role)
		if roleErr != nil {
			return nil, roleErr
		}
		openAIMessage := &openaiconnector.OpenAIMessage{
			Role: *messageRole,
			Name: dto.Name,
		}
		if dto.Content != nil {
			if dto.TemplateVariables != nil {
				parsedContent, parseErr := ParseTemplateVariables(
					*dto.Content,
					*dto.TemplateVariables,
					templateVariables,
				)
				if parseErr != nil {
					return nil, parseErr
				}
				openAIMessage.Content = &parsedContent
			} else {
				openAIMessage.Content = dto.Content
			}
		}

		if dto.FunctionArguments != nil {
			openAIMessage.FunctionCall = &openaiconnector.OpenAIFunctionCall{
				Name:      *dto.Name,
				Arguments: strings.Join(*dto.FunctionArguments, ","),
			}
		}

		promptRequest.Messages = append(promptRequest.Messages, openAIMessage)
	}

	return promptRequest, nil
}

func GetRequestPromptString(messages []*openaiconnector.OpenAIMessage) string {
	var promptMessages string
	for _, message := range messages {
		if message.Content != nil {
			promptMessages += *message.Content
			promptMessages += "\n"
		}
	}

	return strings.TrimRight(promptMessages, "\n")
}

var modelEncodingMap = map[models.ModelType]tokenizer.Encoding{
	models.ModelTypeGpt35Turbo:    tokenizer.Cl100kBase,
	models.ModelTypeGpt35Turbo16k: tokenizer.Cl100kBase,
	models.ModelTypeGpt4:          tokenizer.Cl100kBase,
	models.ModelTypeGpt432k:       tokenizer.Cl100kBase,
}

// GetStringTokenCount returns the number of tokens in a given string.
func GetStringTokenCount(value string, modelType models.ModelType) int32 {
	encoding := modelEncodingMap[modelType]
	enc := exc.MustResult(tokenizer.Get(encoding))
	ids, _, _ := enc.Encode(value)
	return int32(len(ids))
}

type TokenCountCostResult struct {
	InputTokenCount  int32
	OutputTokenCount int32
	InputTokenCost   decimal.Decimal
	OutputTokenCost  decimal.Decimal
}

// CalculateTokenCountsAndCosts calculates the input and output tokens count and costs for a given model type / vendor.
func CalculateTokenCountsAndCosts(
	promptInputValue string,
	promptOutputValue string,
	modelPricing datatypes.ProviderModelPricingDTO,
	modelType models.ModelType,
) TokenCountCostResult {
	// The unit size is the number of token per which we calculate the price. E.g. 0.002$ for 1000 tokens.
	unitSize := decimal.NewFromInt32(modelPricing.TokenUnitSize)

	// inputTokensCount is the count of tokens in the input string. Their cost is lower than that of output.
	inputTokensCount := GetStringTokenCount(promptInputValue, modelType)

	// outputTokensCount is the count of tokens in the output string. Their cost is higher than that of input.
	outputTokensCount := GetStringTokenCount(promptOutputValue, modelType)

	// priceInput is the cost of the input tokens.
	priceInput := decimal.NewFromInt32(inputTokensCount).
		Div(unitSize).
		Mul(modelPricing.InputTokenPrice)

	// priceOutput is the cost of the output tokens.
	priceOutput := decimal.NewFromInt32(outputTokensCount).
		Div(unitSize).
		Mul(modelPricing.OutputTokenPrice)

	return TokenCountCostResult{
		InputTokenCount:  inputTokensCount,
		OutputTokenCount: outputTokensCount,
		InputTokenCost:   priceInput,
		OutputTokenCost:  priceOutput,
	}
}

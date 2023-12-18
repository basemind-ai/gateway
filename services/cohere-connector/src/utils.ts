import {
	ChatConnector as CohereChatConnector,
	ChatRequest,
	ChatStreamRequest,
} from 'cohere-ai/api';
import { ChatStreamEndEventFinishReason } from 'cohere-ai/api/types/ChatStreamEndEventFinishReason';
import {
	CohereConnector,
	CohereConnectorType,
	CohereModel,
	CoherePromptRequest,
} from 'gen/cohere/v1/cohere';
import { StreamFinishReason } from 'shared/constants';

export const modelMapping: Record<CohereModel, string> = {
	[CohereModel.UNSPECIFIED]: 'command',
	[CohereModel.COMMAND]: 'command',
	[CohereModel.COMMAND_LIGHT]: 'command-light',
	[CohereModel.COMMAND_NIGHTLY]: 'command-nightly',
	[CohereModel.COMMAND_LIGHT_NIGHTLY]: 'command-light-nightly',
};

export const finishReasonMapping: Record<
	ChatStreamEndEventFinishReason,
	StreamFinishReason
> = {
	[ChatStreamEndEventFinishReason.Complete]: StreamFinishReason.DONE,
	[ChatStreamEndEventFinishReason.ErrorLimit]: StreamFinishReason.ERROR,
	[ChatStreamEndEventFinishReason.MaxTokens]: StreamFinishReason.LIMIT,
	[ChatStreamEndEventFinishReason.Error]: StreamFinishReason.ERROR,
	[ChatStreamEndEventFinishReason.ErrorToxic]: StreamFinishReason.ERROR,
};

/**
 * The getCohereConnectors function takes an array of CohereConnector enums and returns
 * an array of connector objects.
 *
 * @return An array of CohereChatConnector objects
 * @param connectors
 */
export function getCohereConnectors(
	connectors: CohereConnector[],
): CohereChatConnector[] {
	const result: CohereChatConnector[] = [];
	for (const { id, options } of connectors) {
		if (id === CohereConnectorType.UNSPECIFIED) {
			continue;
		}
		result.push({
			id: id === CohereConnectorType.WEB_SEARCH ? 'web-search' : 'id',
			options,
		});
	}

	return result;
}

/**
 * The createCohereRequest function takes a CoherePromptRequest and returns a ChatRequest or
 * ChatStreamRequest.
 *
 * @param grpcRequest CoherePromptRequest
 * @return A ChatRequest or a ChatStreamRequest
 */
export function createCohereRequest(
	grpcRequest: CoherePromptRequest,
): ChatRequest | ChatStreamRequest {
	return {
		connectors:
			Array.isArray(grpcRequest.parameters?.connectors) &&
			grpcRequest.parameters.connectors.length
				? getCohereConnectors(grpcRequest.parameters.connectors)
				: undefined,
		conversationId: grpcRequest.conversationId,
		message: grpcRequest.message,
		model: modelMapping[grpcRequest.model],
		temperature:
			typeof grpcRequest.parameters?.temperature === 'number'
				? grpcRequest.parameters.temperature
				: undefined,
	} satisfies ChatRequest | ChatStreamRequest;
}

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

export function createCohereRequest(
	grpcRequest: CoherePromptRequest,
): ChatRequest | ChatStreamRequest {
	return {
		message: grpcRequest.message,
		model: modelMapping[grpcRequest.model],
		conversationId: grpcRequest.conversationId,
		temperature:
			typeof grpcRequest.parameters?.temperature === 'number'
				? grpcRequest.parameters.temperature
				: undefined,
		connectors:
			Array.isArray(grpcRequest.parameters?.connectors) &&
			grpcRequest.parameters!.connectors.length
				? getCohereConnectors(grpcRequest.parameters!.connectors)
				: undefined,
	} satisfies ChatRequest | ChatStreamRequest;
}

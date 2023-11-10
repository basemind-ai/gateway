import {
	ChatConnector as CohereChatConnector,
	ChatRequest,
	ChatStreamRequest,
} from 'cohere-ai/api';
import {
	CohereConnector,
	CohereConnectorType,
	CohereModel,
	CoherePromptRequest,
} from 'gen/cohere/v1/cohere';

export const modelMapping: Record<CohereModel, string> = {
	[CohereModel.UNSPECIFIED]: 'command',
	[CohereModel.COMMAND]: 'command',
	[CohereModel.COMMAND_LIGHT]: 'command-light',
	[CohereModel.COMMAND_NIGHTLY]: 'command-nightly',
	[CohereModel.COMMAND_LIGHT_NIGHTLY]: 'command-light-nightly',
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

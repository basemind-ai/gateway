import { GenerateRequest } from 'cohere-ai/api/client/requests/GenerateRequest';
import { ChatStreamEndEventFinishReason } from 'cohere-ai/api/types/ChatStreamEndEventFinishReason';
import { CohereModel, CoherePromptRequest } from 'gen/cohere/v1/cohere';
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
 * The getModel function takes a CohereModel and returns a string
 *
 * @param model CohereModel
 *
 * @return A string
 */
export function getModel(model: CoherePromptRequest['model']): string {
	return modelMapping[model];
}

/**
 * The createCohereRequest function takes a CoherePromptRequest and returns a Cohere client.CoherePromptRequest
 *
 * @param grpcRequest CoherePromptRequest
 *
 * @return A CoherePromptRequest
 */
export function createCohereRequest(
	grpcRequest: CoherePromptRequest,
): GenerateRequest {
	return {
		model: getModel(grpcRequest.model),
		prompt: grpcRequest.message,
		...grpcRequest.parameters,
	} satisfies GenerateRequest;
}

/**
 *
 * @param finishReason the stream finish reason from Cohere
 *
 * @return A StreamFinishReason
 */
export function getFinishReason(
	finishReason: 'COMPLETE' | 'MAX_TOKENS' | 'ERROR' | 'ERROR_TOXIC',
) {
	if (finishReason === 'COMPLETE') {
		return StreamFinishReason.DONE;
	} else if (finishReason === 'MAX_TOKENS') {
		return StreamFinishReason.LIMIT;
	} else {
		return StreamFinishReason.ERROR;
	}
}

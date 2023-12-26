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
 * The createCohereRequest function takes a CoherePromptRequest and returns a Cohere client.CoherePromptRequest
 *
 * @param grpcRequest CoherePromptRequest
 * @param stream boolean
 *
 * @return A CoherePromptRequest
 */
export function createCohereRequest(
	grpcRequest: CoherePromptRequest,
): GenerateRequest {
	return {
		model: modelMapping[grpcRequest.model],
		prompt: grpcRequest.message,
		...grpcRequest.parameters,
	} satisfies GenerateRequest;
}

/*
 * The readChunks function takes a ReadableStreamDefaultReader and returns an AsyncIterableIterator that yields values
 * from the stream.
 * */
export function readChunks<T extends Record<string, any>>(
	reader: ReadableStreamDefaultReader<Uint8Array>,
) {
	const decoder = new TextDecoder();

	return {
		async *[Symbol.asyncIterator]() {
			let readResult = await reader.read();

			while (!readResult.done) {
				yield JSON.parse(decoder.decode(readResult.value)) as T;
				readResult = await reader.read();
			}
		},
	};
}

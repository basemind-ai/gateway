import {
	sendUnaryData,
	ServerUnaryCall,
	ServerWritableStream,
} from '@grpc/grpc-js';
import {
	CoherePromptRequest,
	CoherePromptResponse,
	CohereStreamResponse,
} from 'gen/cohere/v1/cohere';
import { StreamFinishReason } from 'shared/constants';
import { extractProviderAPIKeyFromMetadata, GrpcError } from 'shared/grpc';
import logger from 'shared/logger';

import { createOrDefaultClient } from '@/client';
import { createCohereRequest, finishReasonMapping } from '@/utils';

/**
 * The openAIPrompt function is a gRPC handler function.
 *
 * @param call ServerUnaryCall object, including the request and metadata
 * @param callback sendUnaryData handler, allowing sending a response back to the client.
 */
export async function coherePrompt(
	call: ServerUnaryCall<CoherePromptRequest, CoherePromptResponse>,
	callback: sendUnaryData<CoherePromptResponse>,
) {
	logger.debug(
		{ path: call.getPath(), request: call.request },
		'received Cohere prompt request',
	);

	const client = createOrDefaultClient(
		extractProviderAPIKeyFromMetadata(call),
	);

	try {
		logger.debug('making Cohere prompt request');
		const startTime = Date.now();
		const { text, generationId } = await client.chat(
			createCohereRequest(call.request),
		);
		const finishTime = Date.now();

		logger.debug(
			{ finishTime, generationId, startTime, text },
			'Cohere request completed',
		);
		callback(null, { content: text } satisfies CoherePromptResponse);
	} catch (error: unknown) {
		logger.error(error as Error, 'error communicating with Cohere');
		callback(new GrpcError({ message: (error as Error).message }), null);
	}
}

/**
 * The cohereStream function is a gRPC streaming function.
 * Each response object contains either the generated text or an indication that generation has finished (and why).
 *
 * @param call ServerWritableStream - the gRPC streaming handler.
 */
export async function cohereStream(
	call: ServerWritableStream<CoherePromptRequest, CohereStreamResponse>,
) {
	logger.debug(
		{ path: call.getPath(), request: call.request },
		'received Cohere stream request',
	);

	const client = createOrDefaultClient(
		extractProviderAPIKeyFromMetadata(call),
	);

	const startTime = Date.now();
	try {
		logger.debug('making OpenAI stream request');
		const stream = await client.chatStream(
			createCohereRequest(call.request),
		);
		for await (const message of stream) {
			if (message.eventType === 'text-generation') {
				call.write({
					content: message.text,
				} satisfies CohereStreamResponse);
				continue;
			}
			if (message.eventType === 'stream-end') {
				call.write({
					finishReason: finishReasonMapping[message.finishReason],
				} satisfies CohereStreamResponse);
			}
		}

		const finishTime = Date.now();
		logger.debug(
			{ finishTime, startTime },
			'Cohere streaming request completed',
		);
	} catch (error: unknown) {
		call.write({
			finishReason: StreamFinishReason.ERROR,
		} satisfies CohereStreamResponse);
		logger.error(error as Error, 'error communicating with Cohere');
	} finally {
		call.end();
	}
}

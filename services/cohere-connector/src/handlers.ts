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
import { GrpcError } from 'shared/grpc';
import logger from 'shared/logger';

import { getCohereClient } from '@/client';
import { createCohereRequest } from '@/utils';

export async function coherePrompt(
	call: ServerUnaryCall<CoherePromptRequest, CoherePromptResponse>,
	callback: sendUnaryData<CoherePromptResponse>,
) {
	logger.debug(
		{ path: call.getPath(), request: call.request },
		'received Cohere prompt request',
	);
	try {
		logger.debug('making Cohere prompt request');
		const startTime = Date.now();
		const { text } = await getCohereClient().chat(
			createCohereRequest(call.request),
		);
		const finishTime = Date.now();

		logger.debug(
			{ startTime, finishTime, text },
			'Cohere request completed',
		);
		callback(null, { content: text } satisfies CoherePromptResponse);
	} catch (error: unknown) {
		logger.error(error, 'error communicating with Cohere');
		callback(new GrpcError({ message: (error as Error).message }), null);
	}
}

export async function cohereStream(
	call: ServerWritableStream<CoherePromptRequest, CohereStreamResponse>,
) {
	logger.debug(
		{ path: call.getPath(), request: call.request },
		'received Cohere stream request',
	);
	const startTime = Date.now();
	try {
		logger.debug('making OpenAI stream request');
		const stream = await getCohereClient().chatStream(
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
					finishReason: 'done',
				} satisfies CohereStreamResponse);
			}
		}

		const finishTime = Date.now();
		logger.debug(
			{ startTime, finishTime },
			'Cohere streaming request completed',
		);
	} catch (error: unknown) {
		/* c8 ignore next */
		call.write({
			finishReason: 'error',
		} satisfies CohereStreamResponse);
		logger.error(error, 'error communicating with Cohere');
	} finally {
		call.end();
	}
}

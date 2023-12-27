import {
	sendUnaryData,
	ServerUnaryCall,
	ServerWritableStream,
} from '@grpc/grpc-js';
import { Generation } from 'cohere-ai/api';
import {
	CoherePromptRequest,
	CoherePromptResponse,
	CohereStreamResponse,
} from 'gen/cohere/v1/cohere';
import {
	createInternalGrpcError,
	extractProviderAPIKeyFromMetadata,
	GrpcError,
} from 'shared/grpc';
import logger from 'shared/logger';

import { createOrDefaultClient } from '@/client';
import { createCohereRequest, getFinishReason } from '@/utils';

const COMMUNICATION_ERROR_MESSAGE = 'error communicating with Cohere';
const DECODER = new TextDecoder();

/**
 * The coherePrompt function is a gRPC handler function.
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
		const { generations } = await client.generate(
			createCohereRequest(call.request),
		);
		const finishTime = Date.now();

		logger.debug(
			{ finishTime, generations, startTime },
			'Cohere request completed',
		);
		callback(null, {
			content: generations[0]?.text ?? '',
		} satisfies CoherePromptResponse);
	} catch (error: unknown) {
		logger.error(error as Error, COMMUNICATION_ERROR_MESSAGE);
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
		logger.debug('making Cohere stream request');
		const stream = await client.generateStream(
			createCohereRequest(call.request),
		);

		stream.on('error', (error: Error) => {
			call.destroy(createInternalGrpcError(error));
			logger.error(error, COMMUNICATION_ERROR_MESSAGE);
		});

		stream.on('data', (data: Uint8Array) => {
			const {
				is_finished: isFinished,
				finish_reason: finishReason,
				text: content,
			} = JSON.parse(DECODER.decode(data)) as {
				finish_reason?:
					| 'COMPLETE'
					| 'MAX_TOKENS'
					| 'ERROR'
					| 'ERROR_TOXIC';
				is_finished: boolean;
				response?: Generation;
				text: string;
			};
			if (isFinished) {
				const finishTime = Date.now();
				logger.debug(
					{ finishTime, startTime },
					'Cohere streaming request completed',
				);
				call.write({
					finishReason: getFinishReason(finishReason!),
				});
			} else {
				logger.debug('writing Cohere stream response', content);
				call.write({ content });
			}
		});
		stream.on('end', () => {
			logger.debug('Cohere stream ended, closing');
			call.end();
		});
	} catch (error: unknown) {
		logger.error(error as Error, COMMUNICATION_ERROR_MESSAGE);
		call.destroy(createInternalGrpcError(error as Error));
	}
}

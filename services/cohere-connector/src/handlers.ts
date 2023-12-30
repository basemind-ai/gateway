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

import { BasemindCohereClient, createOrDefaultClient } from '@/client';
import { createCohereRequest, getFinishReason, getModel } from '@/utils';

const COMMUNICATION_ERROR_MESSAGE = 'error communicating with Cohere';
const DECODER = new TextDecoder();

export async function getTokensCount({
	client,
	requestText,
	responseText,
	model,
}: {
	client: BasemindCohereClient;
	model: CoherePromptRequest['model'];
	requestText: string;
	responseText: string;
}): Promise<{
	requestTokensCount: number;
	responseTokensCount: number;
}> {
	const cohereModel = getModel(model);

	logger.debug(
		{
			cohereModel,
			requestTextLength: requestText.length,
			responseText: responseText.length,
		},
		'requesting tokenization from Cohere',
	);

	const [requestTokensCount, responseTokensCount] = await Promise.all([
		requestText.trim().length
			? client.tokenize(requestText, cohereModel)
			: Promise.resolve(0),
		responseText.trim().length
			? client.tokenize(responseText, cohereModel)
			: Promise.resolve(0),
	]);

	logger.debug(
		{
			requestTokensCount,
			responseTokensCount,
		},
		'received tokenization from Cohere',
	);

	return {
		requestTokensCount,
		responseTokensCount,
	};
}

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
		const response = generations[0]?.text ?? '';

		const { requestTokensCount, responseTokensCount } =
			await getTokensCount({
				client,
				model: call.request.model,
				requestText: call.request.message,
				responseText: response,
			});
		const finishTime = Date.now();

		logger.debug(
			{ finishTime, generations, startTime },
			'Cohere request completed',
		);
		callback(null, {
			content: response,
			requestTokensCount,
			responseTokensCount,
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

		const messages: string[] = [];

		stream.on('error', (error: Error) => {
			call.destroy(createInternalGrpcError(error));
			logger.error(error, COMMUNICATION_ERROR_MESSAGE);
		});

		stream.on('data', (data: Uint8Array) => {
			(async () => {
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
					const { requestTokensCount, responseTokensCount } =
						await getTokensCount({
							client,
							model: call.request.model,
							requestText: call.request.message,
							responseText: messages.join(''),
						});

					const finishTime = Date.now();
					logger.debug(
						{ finishTime, startTime },
						'Cohere streaming request completed',
					);
					call.write({
						finishReason: getFinishReason(finishReason!),
						requestTokensCount,
						responseTokensCount,
					});
				} else {
					messages.push(content);

					logger.debug('writing Cohere stream response', content);
					call.write({ content });
				}
			})();
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

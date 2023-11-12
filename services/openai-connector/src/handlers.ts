import {
	sendUnaryData,
	ServerUnaryCall,
	ServerWritableStream,
} from '@grpc/grpc-js';
import {
	OpenAIPromptRequest,
	OpenAIPromptResponse,
	OpenAIStreamResponse,
} from 'gen/openai/v1/openai';
import { StreamFinishReason } from 'shared/constants';
import { extractProviderAPIKeyFromMetadata, GrpcError } from 'shared/grpc';
import logger from 'shared/logger';

import { createOrDefaultClient } from '@/client';
import { createOpenAIRequest, finishReasonMap } from '@/utils';

/**
 * The openAIPrompt function is a gRPC handler function.
 *
 * @param call ServerUnaryCall object, including the request and metadata
 * @param callback sendUnaryData handler, allowing sending a response back to the client.
 */
export async function openAIPrompt(
	call: ServerUnaryCall<OpenAIPromptRequest, OpenAIPromptResponse>,
	callback: sendUnaryData<OpenAIPromptResponse>,
) {
	logger.debug(
		{ path: call.getPath(), request: call.request },
		'received OpenAI prompt request',
	);

	const client = createOrDefaultClient(
		extractProviderAPIKeyFromMetadata(call),
	);

	try {
		logger.debug('making OpenAI prompt request');
		const startTime = Date.now();
		const request = createOpenAIRequest(call.request, false);
		const { usage, choices } =
			await client.chat.completions.create(request);
		const finishTime = Date.now();

		logger.debug(
			{ startTime, finishTime, choices },
			'OpenAI request completed',
		);
		callback(null, {
			content: choices[0]?.message.content ?? '',
			promptTokens: usage?.prompt_tokens ?? 0,
			completionTokens: usage?.completion_tokens ?? 0,
			totalTokens: usage?.total_tokens ?? 0,
		} satisfies OpenAIPromptResponse);
	} catch (error: unknown) {
		logger.error(error, 'error communicating with OpenAI');
		callback(new GrpcError({ message: (error as Error).message }), null);
	}
}
/**
 * The openAIStream function is a gRPC server streaming function. The request contains the prompt, temperature,
 * top_p, n and stream parameters. The response contains the content of each message sent by the client to openai
 * as well as a finishReason which indicates why
 * openai stopped sending messages (either because it reached max tokens or because it was interrupted). This function
 *
 * @param call ServerWritableStream - the gRPC streaming handler.
 */
export async function openAIStream(
	call: ServerWritableStream<OpenAIPromptRequest, OpenAIStreamResponse>,
) {
	logger.debug(
		{ path: call.getPath(), request: call.request },
		'received OpenAI stream request',
	);

	const client = createOrDefaultClient(
		extractProviderAPIKeyFromMetadata(call),
	);

	const startTime = Date.now();
	try {
		logger.debug('making OpenAI stream request');
		const request = createOpenAIRequest(call.request, true);
		const stream = await client.chat.completions.create(request);
		for await (const message of stream) {
			call.write({
				content: message.choices[0].delta.content ?? '',
				finishReason: message.choices[0].finish_reason
					? finishReasonMap[message.choices[0].finish_reason]
					: undefined,
			} satisfies OpenAIStreamResponse);
		}

		const finishTime = Date.now();
		logger.debug(
			{ startTime, finishTime },
			'OpenAI streaming request completed',
		);
	} catch (error: unknown) {
		call.write({
			content: '',
			finishReason: StreamFinishReason.ERROR,
		});
		logger.error(error, 'error communicating with OpenAI');
	} finally {
		call.end();
	}
}

/* eslint-disable @typescript-eslint/no-unnecessary-condition */
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
import {
	createInternalGrpcError,
	extractProviderAPIKeyFromMetadata,
} from 'shared/grpc';
import logger from 'shared/logger';

import { createOrDefaultClient } from '@/client';
import {
	createOpenAIRequest,
	getFinishReason,
	getOpenAIModel,
	getTokenCount,
	OpenAIFinishReason,
} from '@/utils';

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
			{ choices, finishTime, startTime },
			'OpenAI request completed',
		);

		const promptResponseContent = choices[0]?.message.content ?? '';
		const requestTokensCount =
			usage?.prompt_tokens ??
			getTokenCount(
				call.request.messages.map((m) => m.content ?? '').join(''),
				getOpenAIModel(call.request.model),
			);
		const responseTokensCount =
			usage?.completion_tokens ??
			getTokenCount(
				promptResponseContent,
				getOpenAIModel(call.request.model),
			);

		callback(null, {
			content: promptResponseContent,
			finishReason: getFinishReason(choices[0]?.finish_reason),
			requestTokensCount,
			responseTokensCount,
		} satisfies OpenAIPromptResponse);
	} catch (error: unknown) {
		callback(createInternalGrpcError(error as Error), null);
		logger.error(error as Error, 'error communicating with OpenAI');
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

		let responseContent = '';
		let finishReason: OpenAIFinishReason | undefined;

		for await (const message of stream) {
			const choice = message.choices[0];

			const content = choice?.delta?.content ?? '';

			responseContent += content;
			finishReason = choice?.finish_reason ?? undefined;

			call.write({
				content,
			} satisfies OpenAIStreamResponse);
		}

		call.end({
			content: '',
			finishReason: getFinishReason(finishReason),
			requestTokensCount: getTokenCount(
				call.request.messages.map((m) => m.content ?? '').join(''),
				getOpenAIModel(call.request.model),
			),
			responseTokensCount: getTokenCount(
				responseContent,
				getOpenAIModel(call.request.model),
			),
		});

		const finishTime = Date.now();
		logger.debug(
			{ finishTime, startTime },
			'OpenAI streaming request completed',
		);
	} catch (error: unknown) {
		call.destroy(createInternalGrpcError(error as Error));
		logger.error(error as Error, 'error communicating with OpenAI');
		return;
	}
	call.end();
}

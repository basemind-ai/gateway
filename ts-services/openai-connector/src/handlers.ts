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
import { GrpcError } from 'shared/utils';
import logger from 'shared/utils/logger';

import { getOpenAIClient } from '@/client';
import { createOpenAIRequest } from '@/utils';

export async function openAIPrompt(
	call: ServerUnaryCall<OpenAIPromptRequest, OpenAIPromptResponse>,
	callback: sendUnaryData<OpenAIPromptResponse>,
) {
	logger.debug(
		{ path: call.getPath(), request: call.request },
		'received openAIPrompt request',
	);
	try {
		logger.debug('making openAI prompt request');
		const startTime = Date.now();
		const request = createOpenAIRequest(call.request, false);
		const { usage, choices } =
			await getOpenAIClient().chat.completions.create(request);
		const finishTime = Date.now();
		logger.debug({ startTime, finishTime }, 'openAI request completed');
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

export async function openAIStream(
	call: ServerWritableStream<OpenAIPromptRequest, OpenAIStreamResponse>,
) {
	logger.debug(
		{ path: call.getPath(), request: call.request },
		'received openAIsTREAM request',
	);
	const startTime = Date.now();
	try {
		logger.debug('making openAI stream request');
		const request = createOpenAIRequest(call.request, true);
		const stream = await getOpenAIClient().chat.completions.create(request);
		for await (const message of stream) {
			call.write({
				content: message.choices[0]?.delta?.content ?? '',
				finishReason: message.choices[0]?.finish_reason ?? undefined,
			} satisfies OpenAIStreamResponse);
		}
		const finishTime = Date.now();
		logger.debug(
			{ startTime, finishTime },
			'openAI streaming request completed',
		);
	} catch (error: unknown) {
		logger.error(error, 'error communicating with OpenAI');
	} finally {
		call.end();
	}
}

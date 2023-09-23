/* eslint-disable unicorn/consistent-function-scoping */
import {
	sendUnaryData,
	ServerUnaryCall,
	ServerWritableStream,
} from '@grpc/grpc-js';
import {
	OpenAIMessageRole,
	OpenAIModel,
	OpenAIPromptRequest,
	OpenAIPromptResponse,
	OpenAIStreamResponse,
} from 'gen/openai/v1/openai';
import { GrpcError } from 'shared/grpc';
import { Mock } from 'vitest';

import { getOpenAIClient } from '@/client';
import { openAIPrompt, openAIStream } from '@/handlers';

describe('handlers tests', () => {
	const openAPIKey = (process.env.OPEN_AI_API_KEY =
		process.env.OPEN_AI_API_KEY ?? 'abc');

	afterAll(() => {
		process.env.OPEN_AI_API_KEY = openAPIKey;
	});

	const client = getOpenAIClient();
	const completionsSpy = vi.spyOn(client.chat.completions, 'create');

	describe('openAIPrompt', () => {
		const makeMockUnaryCall = (
			request: OpenAIPromptRequest,
		): ServerUnaryCall<OpenAIPromptRequest, OpenAIPromptResponse> => {
			return {
				getPath: vi.fn(),
				request,
			} as unknown as ServerUnaryCall<
				OpenAIPromptRequest,
				OpenAIPromptResponse
			>;
		};

		it('should successfully complete an OpenAI prompt request and send the expected response', async () => {
			const call = makeMockUnaryCall({
				model: OpenAIModel.OPEN_AI_MODEL_GPT3_5_TURBO_4K,
				messages: [
					{
						content: 'test',
						role: OpenAIMessageRole.OPEN_AI_MESSAGE_ROLE_USER,
					},
				],
				parameters: {
					temperature: 0.8,
					topP: 0.9,
					maxTokens: 100,
					presencePenalty: 0.5,
					frequencyPenalty: 0.5,
				},
				applicationId: '123',
			});
			const callback: sendUnaryData<OpenAIPromptResponse> = vi.fn();

			completionsSpy.mockResolvedValueOnce({
				id: 'abc',
				model: 'gpt-3.5-turbo',
				object: 'text_completion',
				created: Date.now(),
				choices: [
					{
						message: {
							content: 'Generated response',
							role: 'assistant',
						},
						index: 0,
						finish_reason: 'stop',
					},
				],
				usage: {
					prompt_tokens: 10,
					completion_tokens: 20,
					total_tokens: 30,
				},
			});

			await openAIPrompt(call, callback);
			expect(completionsSpy).toHaveBeenCalledWith({
				frequency_penalty: 0.5,
				max_tokens: 100,
				messages: [
					{
						content: 'test',
						role: 'user',
					},
				],
				model: 'gpt-3.5-turbo',
				presence_penalty: 0.5,
				stream: false,
				temperature: 0.8,
				top_p: 0.9,
				user: '123',
			});

			expect(callback).toHaveBeenCalledWith(null, {
				content: 'Generated response',
				promptTokens: 10,
				completionTokens: 20,
				totalTokens: 30,
			});
		});

		it('should return an empty content string when the choices array is empty', async () => {
			const call = makeMockUnaryCall({
				model: OpenAIModel.OPEN_AI_MODEL_GPT3_5_TURBO_4K,
				messages: [
					{
						content: 'test',
						role: OpenAIMessageRole.OPEN_AI_MESSAGE_ROLE_USER,
					},
				],
			});
			const callback: sendUnaryData<OpenAIPromptResponse> = vi.fn();

			completionsSpy.mockResolvedValueOnce({
				id: 'abc',
				model: 'gpt-3.5-turbo',
				object: 'text_completion',
				created: Date.now(),
				choices: [],
				usage: {
					prompt_tokens: 10,
					completion_tokens: 0,
					total_tokens: 10,
				},
			});

			await openAIPrompt(call, callback);
			expect(completionsSpy).toHaveBeenCalledWith({
				messages: [
					{
						content: 'test',
						role: 'user',
					},
				],
				model: 'gpt-3.5-turbo',
				stream: false,
			});

			expect(callback).toHaveBeenCalledWith(null, {
				content: '',
				promptTokens: 10,
				completionTokens: 0,
				totalTokens: 10,
			});
		});

		it('should send a GrpcError when an error occurs during the OpenAI prompt request', async () => {
			const call = makeMockUnaryCall({
				model: OpenAIModel.OPEN_AI_MODEL_GPT3_5_TURBO_4K,
				messages: [
					{
						content: 'test',
						role: OpenAIMessageRole.OPEN_AI_MESSAGE_ROLE_USER,
					},
				],
			});
			const callback: sendUnaryData<OpenAIPromptResponse> = vi.fn();

			const error = new Error('OpenAI error');
			completionsSpy.mockRejectedValueOnce(error);

			await openAIPrompt(call, callback);
			expect(completionsSpy).toHaveBeenCalledWith({
				messages: [
					{
						content: 'test',
						role: 'user',
					},
				],
				model: 'gpt-3.5-turbo',
				stream: false,
			});

			expect(callback).toHaveBeenCalledWith(
				new GrpcError({ message: error.message }),
				null,
			);
		});
	});

	describe('openAIStream', () => {
		const makeServerWritableStream = (
			request: OpenAIPromptRequest,
		): ServerWritableStream<OpenAIPromptRequest, OpenAIStreamResponse> => {
			return {
				getPath: vi.fn(),
				write: vi.fn(),
				end: vi.fn(),
				request,
			} as unknown as ServerWritableStream<
				OpenAIPromptRequest,
				OpenAIStreamResponse
			>;
		};

		function createReadableStream(): AsyncIterableIterator<any> {
			let count = 0;
			return {
				async next() {
					const value = {
						id: 'abc',
						model: 'gpt-3.5-turbo',
						object: 'text_completion',
						created: Date.now(),
						choices: [
							{
								delta: {
									content: count.toString(),
									role: 'assistant',
								},
								index: count,
								finish_reason: count < 10 ? null : 'stop',
							},
						],
					};
					count++;
					return { done: count > 10, value };
				},
				async return() {
					return { done: true, value: undefined };
				},
				[Symbol.asyncIterator]() {
					return this;
				},
			};
		}

		it('should successfully create an OpenAI stream request and write the response to the call', async () => {
			const call = makeServerWritableStream({
				model: OpenAIModel.OPEN_AI_MODEL_GPT3_5_TURBO_4K,
				messages: [
					{
						content: 'test',
						role: OpenAIMessageRole.OPEN_AI_MESSAGE_ROLE_USER,
					},
				],
				parameters: {
					temperature: 0.8,
					topP: 0.9,
					maxTokens: 100,

					presencePenalty: 0.5,
					frequencyPenalty: 0.5,
				},
				applicationId: '123',
			});
			completionsSpy.mockResolvedValueOnce(createReadableStream() as any);
			await openAIStream(call);
			expect((call.write as Mock).mock.calls).toEqual([
				[
					{
						content: '0',
						finishReason: undefined,
					},
				],
				[
					{
						content: '1',
						finishReason: undefined,
					},
				],
				[
					{
						content: '2',
						finishReason: undefined,
					},
				],
				[
					{
						content: '3',
						finishReason: undefined,
					},
				],
				[
					{
						content: '4',
						finishReason: undefined,
					},
				],
				[
					{
						content: '5',
						finishReason: undefined,
					},
				],
				[
					{
						content: '6',
						finishReason: undefined,
					},
				],
				[
					{
						content: '7',
						finishReason: undefined,
					},
				],
				[
					{
						content: '8',
						finishReason: undefined,
					},
				],
				[
					{
						content: '9',
						finishReason: undefined,
					},
				],
			]);
		});
	});
});

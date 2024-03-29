/* eslint-disable unicorn/consistent-function-scoping */
import {
	Metadata,
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
import { StreamFinishReason } from 'shared/constants';
import { createInternalGrpcError } from 'shared/grpc';
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
				metadata: new Metadata(),
				request,
			} as unknown as ServerUnaryCall<
				OpenAIPromptRequest,
				OpenAIPromptResponse
			>;
		};

		it('should successfully complete an OpenAI prompt request and send the expected response', async () => {
			const call = makeMockUnaryCall({
				applicationId: '123',
				messages: [
					{
						content: 'test',
						role: OpenAIMessageRole.OPEN_AI_MESSAGE_ROLE_USER,
					},
				],
				model: OpenAIModel.OPEN_AI_MODEL_GPT3_5_TURBO_4K,
				parameters: {
					frequencyPenalty: 0.5,
					maxTokens: 100,
					presencePenalty: 0.5,
					temperature: 0.8,
					topP: 0.9,
				},
			});
			const callback: sendUnaryData<OpenAIPromptResponse> = vi.fn();

			completionsSpy.mockResolvedValueOnce({
				choices: [
					{
						finish_reason: 'stop',
						index: 0,
						logprobs: null,
						message: {
							content: 'Generated response',
							role: 'assistant',
						},
					},
				],
				created: Date.now(),
				id: 'abc',
				model: 'gpt-3.5-turbo',
				object: 'chat.completion',
				usage: {
					completion_tokens: 20,
					prompt_tokens: 10,
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
				finishReason: StreamFinishReason.DONE,
				requestTokensCount: 10,
				responseTokensCount: 20,
			});
		});

		it('should return an empty content string when the choices array is empty', async () => {
			const call = makeMockUnaryCall({
				messages: [
					{
						content: 'test',
						role: OpenAIMessageRole.OPEN_AI_MESSAGE_ROLE_USER,
					},
				],
				model: OpenAIModel.OPEN_AI_MODEL_GPT3_5_TURBO_4K,
			});
			const callback: sendUnaryData<OpenAIPromptResponse> = vi.fn();

			completionsSpy.mockResolvedValueOnce({
				choices: [],
				created: Date.now(),
				id: 'abc',
				model: 'gpt-3.5-turbo',
				object: 'chat.completion',
				usage: {
					completion_tokens: 0,
					prompt_tokens: 10,
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
				finishReason: StreamFinishReason.DONE,
				requestTokensCount: 10,
				responseTokensCount: 0,
			});
		});

		it('should send a GrpcError when an error occurs during the OpenAI prompt request', async () => {
			const call = makeMockUnaryCall({
				messages: [
					{
						content: 'test',
						role: OpenAIMessageRole.OPEN_AI_MESSAGE_ROLE_USER,
					},
				],
				model: OpenAIModel.OPEN_AI_MODEL_GPT3_5_TURBO_4K,
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
				createInternalGrpcError(
					new Error(
						'Error: an error has occurred communicating with OpenAI',
					),
				),
				null,
			);
		});

		it("should handle finish_reasons that aren't 'stop'", async () => {
			const call = makeMockUnaryCall({
				messages: [
					{
						content: 'test',
						role: OpenAIMessageRole.OPEN_AI_MESSAGE_ROLE_USER,
					},
				],
				model: OpenAIModel.OPEN_AI_MODEL_GPT3_5_TURBO_4K,
			});
			const callback: sendUnaryData<OpenAIPromptResponse> = vi.fn();

			completionsSpy.mockResolvedValueOnce({
				choices: [
					{
						finish_reason: 'length',
						index: 0,
						logprobs: null,
						message: {
							content: 'Generated response',
							role: 'assistant',
						},
					},
				],
				created: Date.now(),
				id: 'abc',
				model: 'gpt-3.5-turbo',
				object: 'chat.completion',
				usage: {
					completion_tokens: 20,
					prompt_tokens: 10,
					total_tokens: 30,
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
				content: 'Generated response',
				finishReason: StreamFinishReason.LIMIT,
				requestTokensCount: 10,
				responseTokensCount: 20,
			});
		});
	});

	describe('openAIStream', () => {
		const makeServerWritableStream = (
			request: OpenAIPromptRequest,
		): ServerWritableStream<OpenAIPromptRequest, OpenAIStreamResponse> => {
			return {
				destroy: vi.fn(),
				end: vi.fn(),
				getPath: vi.fn(),
				metadata: new Metadata(),
				request,
				write: vi.fn(),
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
						choices: [
							{
								delta: {
									content: count < 10 ? count.toString() : '',
									role: 'assistant',
								},
								finish_reason: count === 10 ? 'stop' : null,
								index: count,
							},
						],
						created: Date.now(),
						id: 'abc',
						model: 'gpt-3.5-turbo',
						object: 'chat.completion',
					};
					if (count === 11) {
						return { done: true, value };
					}

					count++;
					return { done: false, value };
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
				applicationId: '123',
				messages: [
					{
						content: 'test',
						role: OpenAIMessageRole.OPEN_AI_MESSAGE_ROLE_USER,
					},
				],
				model: OpenAIModel.OPEN_AI_MODEL_GPT3_5_TURBO_4K,
				parameters: {
					frequencyPenalty: 0.5,
					maxTokens: 100,
					presencePenalty: 0.5,
					temperature: 0.8,
					topP: 0.9,
				},
			});
			completionsSpy.mockResolvedValueOnce(createReadableStream() as any);

			await openAIStream(call);

			expect((call.write as Mock).mock.calls).toEqual([
				[
					{
						content: '0',
					},
				],
				[
					{
						content: '1',
					},
				],
				[
					{
						content: '2',
					},
				],
				[
					{
						content: '3',
					},
				],
				[
					{
						content: '4',
					},
				],
				[
					{
						content: '5',
					},
				],
				[
					{
						content: '6',
					},
				],
				[
					{
						content: '7',
					},
				],
				[
					{
						content: '8',
					},
				],
				[
					{
						content: '9',
					},
				],
				[
					{
						content: '',
						finishReason: 'DONE',
						requestTokensCount: 1,
						responseTokensCount: 4,
					},
					expect.any(Function),
				],
			]);
		});

		it('should handle errors', async () => {
			const call = makeServerWritableStream({
				applicationId: '123',
				messages: [
					{
						content: 'test',
						role: OpenAIMessageRole.OPEN_AI_MESSAGE_ROLE_USER,
					},
				],
				model: OpenAIModel.OPEN_AI_MODEL_GPT3_5_TURBO_4K,
				parameters: {
					frequencyPenalty: 0.5,
					maxTokens: 100,
					presencePenalty: 0.5,
					temperature: 0.8,
					topP: 0.9,
				},
			});
			const error = new Error('test error');
			completionsSpy.mockRejectedValueOnce(error);

			await openAIStream(call);
			expect(call.destroy as Mock).toHaveBeenCalledWith(
				createInternalGrpcError(
					new Error(
						'Error: an error has occurred communicating with OpenAI',
					),
				),
			);
		});
	});
});

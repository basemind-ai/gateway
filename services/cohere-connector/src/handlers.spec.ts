/* eslint-disable unicorn/consistent-function-scoping */
import {
	Metadata,
	sendUnaryData,
	ServerUnaryCall,
	ServerWritableStream,
} from '@grpc/grpc-js';
import { StreamedChatResponse } from 'cohere-ai/api';
import {
	CohereModel,
	CoherePromptRequest,
	CoherePromptResponse,
	CohereStreamResponse,
} from 'gen/cohere/v1/cohere';
import { GrpcError } from 'shared/grpc';
import { Mock } from 'vitest';

import { getCohereClient } from '@/client';
import { coherePrompt, cohereStream } from '@/handlers';
import StreamEnd = StreamedChatResponse.StreamEnd;
import { StreamFinishReason } from 'shared/constants';

describe('handlers tests', () => {
	const openAPIKey = (process.env.COHERE_API_KEY =
		process.env.COHERE_API_KEY ?? 'abc');

	afterAll(() => {
		process.env.COHERE_API_KEY = openAPIKey;
	});

	const client = getCohereClient();

	describe('coherePrompt', () => {
		const chatSpy = vi.spyOn(client, 'chat');

		const makeMockUnaryCall = (
			request: CoherePromptRequest,
		): ServerUnaryCall<CoherePromptRequest, CoherePromptResponse> => {
			return {
				getPath: vi.fn(),
				metadata: new Metadata(),
				request,
			} as unknown as ServerUnaryCall<
				CoherePromptRequest,
				CoherePromptResponse
			>;
		};

		it('should successfully complete an Cohere prompt request and send the expected response', async () => {
			const call = makeMockUnaryCall({
				conversationId: '123',
				message: 'test',
				model: CohereModel.COMMAND,
				parameters: {
					connectors: [],
					temperature: 0.8,
				},
			});
			const callback: sendUnaryData<CoherePromptResponse> = vi.fn();

			chatSpy.mockResolvedValueOnce({
				generationId: '123',
				text: 'Generated response',
			});

			await coherePrompt(call, callback);
			expect(chatSpy).toHaveBeenCalledWith({
				connectors: undefined,
				conversationId: '123',
				message: 'test',
				model: 'command',
				temperature: 0.8,
			});

			expect(callback).toHaveBeenCalledWith(null, {
				content: 'Generated response',
			});
		});

		it('should send a GrpcError when an error occurs during the Cohere prompt request', async () => {
			const call = makeMockUnaryCall({
				conversationId: '123',
				message: 'test',
				model: CohereModel.COMMAND,
				parameters: {
					connectors: [],
					temperature: 0.8,
				},
			});
			const callback: sendUnaryData<CoherePromptResponse> = vi.fn();

			const error = new Error('Cohere error');
			chatSpy.mockRejectedValueOnce(error);

			await coherePrompt(call, callback);
			expect(chatSpy).toHaveBeenCalledWith({
				connectors: undefined,
				conversationId: '123',
				message: 'test',
				model: 'command',
				temperature: 0.8,
			});

			expect(callback).toHaveBeenCalledWith(
				new GrpcError({ message: error.message }),
				null,
			);
		});
	});

	describe('cohereStream', () => {
		const chatStreamSpy = vi.spyOn(client, 'chatStream');

		const makeServerWritableStream = (
			request: CoherePromptRequest,
		): ServerWritableStream<CoherePromptRequest, CohereStreamResponse> => {
			return {
				end: vi.fn(),
				getPath: vi.fn(),
				metadata: new Metadata(),
				request,
				write: vi.fn(),
			} as unknown as ServerWritableStream<
				CoherePromptRequest,
				CohereStreamResponse
			>;
		};

		function createReadableStream(): AsyncIterableIterator<any> {
			let count = 0;
			return {
				async next() {
					if (count === 11) {
						return { done: true, value: undefined };
					}
					if (count === 10) {
						count++;
						return {
							done: false,
							value: {
								eventType: 'stream-end',
								finishReason: 'COMPLETE',
								response: {
									generationId: '100',
									text: '',
								},
							} satisfies StreamEnd,
						};
					}
					const value = {
						eventType: 'text-generation',
						text: `${count}`,
					};
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

		it('should successfully create an Cohere stream request and write the response to the call', async () => {
			const call = makeServerWritableStream({
				conversationId: '123',
				message: 'test',
				model: CohereModel.COMMAND,
				parameters: {
					connectors: [],
					temperature: 0.8,
				},
			});
			chatStreamSpy.mockResolvedValueOnce(createReadableStream() as any);

			await cohereStream(call);

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
						finishReason: StreamFinishReason.DONE,
					},
				],
			]);
		});

		it('should handle errors', async () => {
			const call = makeServerWritableStream({
				conversationId: '123',
				message: 'test',
				model: CohereModel.COMMAND,
				parameters: {
					connectors: [],
					temperature: 0.8,
				},
			});

			chatStreamSpy.mockRejectedValueOnce(new Error('test error'));

			await cohereStream(call);
			expect((call.write as Mock).mock.calls).toEqual([
				[
					{
						finishReason: StreamFinishReason.ERROR,
					},
				],
			]);
		});
	});
});

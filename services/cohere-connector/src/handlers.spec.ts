/* eslint-disable unicorn/consistent-function-scoping */
import {
	Metadata,
	sendUnaryData,
	ServerUnaryCall,
	ServerWritableStream,
} from '@grpc/grpc-js';
import * as cohere from 'cohere-ai';
import {
	CohereModel,
	CoherePromptRequest,
	CoherePromptResponse,
	CohereStreamResponse,
} from 'gen/cohere/v1/cohere';
import { StreamFinishReason } from 'shared/constants';
import { GrpcError } from 'shared/grpc';
import { Mock, MockInstance } from 'vitest';

import { coherePrompt, cohereStream } from '@/handlers';

describe('handlers tests', () => {
	const openAPIKey = (process.env.COHERE_API_KEY =
		process.env.COHERE_API_KEY ?? 'abc');

	afterAll(() => {
		process.env.COHERE_API_KEY = openAPIKey;
	});

	describe('coherePrompt', () => {
		// @ts-expect-error - MockInstance is not typed correctly
		const generateSpy = vi.spyOn(cohere, 'generate');

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
				message: 'test',
				model: CohereModel.COMMAND,
				parameters: {
					temperature: 0.8,
				},
			});
			const callback: sendUnaryData<CoherePromptResponse> = vi.fn();

			generateSpy.mockResolvedValueOnce({
				// @ts-expect-error - MockInstance is not typed correctly
				generations: [{ id: 'def', text: 'Generated response' }],
				id: 'abc',
			});

			await coherePrompt(call, callback);
			expect(generateSpy).toHaveBeenCalledWith({
				model: 'command',
				prompt: 'test',
				temperature: 0.8,
			});

			expect(callback).toHaveBeenCalledWith(null, {
				content: 'Generated response',
			});
		});

		it('should send a GrpcError when an error occurs during the Cohere prompt request', async () => {
			const call = makeMockUnaryCall({
				message: 'test',
				model: CohereModel.COMMAND,
				parameters: {
					temperature: 0.8,
				},
			});
			const callback: sendUnaryData<CoherePromptResponse> = vi.fn();

			const error = new Error('Cohere error');
			generateSpy.mockRejectedValueOnce(error);

			await coherePrompt(call, callback);
			expect(generateSpy).toHaveBeenCalledWith({
				model: 'command',
				prompt: 'test',
				temperature: 0.8,
			});

			expect(callback).toHaveBeenCalledWith(
				new GrpcError({ message: error.message }),
				null,
			);
		});
	});

	describe('cohereStream', () => {
		global.fetch = vi.fn().mockResolvedValue({
			body: {
				getReader: vi.fn().mockReturnValue(createStreamReader()),
			},
		});

		const makeServerWritableStream = (
			request: CoherePromptRequest,
		): ServerWritableStream<CoherePromptRequest, CohereStreamResponse> => {
			return {
				destroy: vi.fn(),
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

		function createStreamReader(): ReadableStreamDefaultReader {
			let count = 0;
			const encoder = new TextEncoder();

			return {
				cancel(): Promise<void> {
					return Promise.resolve(undefined);
				},
				closed: Promise.resolve(undefined),
				async read() {
					if (count === 11) {
						return { done: true, value: undefined };
					}
					if (count === 10) {
						count++;
						return {
							done: false,
							value: encoder.encode(
								JSON.stringify({
									finish_reason: 'COMPLETE',
									is_finished: true,
								}),
							),
						};
					}
					const value = {
						is_finished: false,
						text: `${count}`,
					};
					count++;
					return {
						done: false,
						value: encoder.encode(JSON.stringify(value)),
					};
				},
				releaseLock(): void {
					return;
				},
			};
		}

		it('should successfully create an Cohere stream request and write the response to the call', async () => {
			const call = makeServerWritableStream({
				message: 'test',
				model: CohereModel.COMMAND,
				parameters: {
					temperature: 0.8,
				},
			});

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

		it.each([''])('should handle errors', async () => {
			const call = makeServerWritableStream({
				message: 'test',
				model: CohereModel.COMMAND,
				parameters: {
					temperature: 0.8,
				},
			});

			(global.fetch as unknown as MockInstance).mockRejectedValueOnce(
				new Error('test error'),
			);

			await cohereStream(call);
			expect(call.destroy as Mock).toHaveBeenCalled();
		});
	});
});

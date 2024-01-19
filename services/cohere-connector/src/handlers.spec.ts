/* eslint-disable unicorn/consistent-function-scoping */

import { PassThrough } from 'node:stream';

import {
	Metadata,
	sendUnaryData,
	ServerUnaryCall,
	ServerWritableStream,
} from '@grpc/grpc-js';
import {
	CohereModel,
	CoherePromptRequest,
	CoherePromptResponse,
	CohereStreamResponse,
} from 'gen/cohere/v1/cohere';
import { StreamFinishReason } from 'shared/constants';
import { GrpcError } from 'shared/grpc';
import { wait } from 'shared/time';
import { Mock, MockInstance } from 'vitest';

import { coherePrompt, cohereStream } from '@/handlers';

const mockGenerate = vi.fn();
const mockTokenize = vi.fn();

vi.mock(
	'cohere-ai',
	async (importOriginal: () => Promise<Record<string, any>>) => {
		const { CohereClient, ...original } = await importOriginal();

		class MockCohereClient extends CohereClient {
			generate = mockGenerate;
			tokenize = mockTokenize;
		}

		return {
			...original,
			CohereClient: MockCohereClient,
		};
	},
);

describe('handlers tests', () => {
	const openAPIKey = (process.env.COHERE_API_KEY =
		process.env.COHERE_API_KEY ?? 'abc');

	afterAll(() => {
		process.env.COHERE_API_KEY = openAPIKey;
	});

	beforeEach(() => {
		mockGenerate.mockReset();
		mockTokenize.mockReset();

		mockTokenize.mockImplementation(() =>
			Promise.resolve({ tokens: ['te', 'st'] }),
		);
	});

	describe('coherePrompt', () => {
		mockTokenize.mockResolvedValue({ tokens: ['te', 'st'] } as any);

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

			mockGenerate.mockResolvedValueOnce({
				generations: [{ id: 'def', text: 'Generated response' }],
				id: 'abc',
			});

			await coherePrompt(call, callback);
			expect(mockGenerate).toHaveBeenCalledWith({
				model: 'command',
				prompt: 'test',
				temperature: 0.8,
			});

			expect(mockTokenize).toHaveBeenCalledTimes(2);

			expect(mockTokenize).toHaveBeenNthCalledWith(1, {
				model: 'command',
				text: 'test',
			});

			expect(mockTokenize).toHaveBeenNthCalledWith(2, {
				model: 'command',
				text: 'Generated response',
			});

			expect(callback).toHaveBeenCalledWith(null, {
				content: 'Generated response',
				finishReason: StreamFinishReason.DONE,
				requestTokensCount: 2,
				responseTokensCount: 2,
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
			mockGenerate.mockRejectedValueOnce(error);

			await coherePrompt(call, callback);
			expect(mockGenerate).toHaveBeenCalledWith({
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
		const stream = new PassThrough();

		global.fetch = vi.fn().mockResolvedValue({
			body: stream,
			ok: true,
			status: 200,
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

		it('should successfully create an Cohere stream request and write the response to the call', async () => {
			const call = makeServerWritableStream({
				message: 'test',
				model: CohereModel.COMMAND,
				parameters: {
					temperature: 0.8,
				},
			});

			const encoder = new TextEncoder();

			for (let i = 0; i < 11; i++) {
				if (i === 10) {
					stream.end(
						encoder.encode(
							JSON.stringify({
								finish_reason: 'COMPLETE',
								is_finished: true,
							}),
						),
					);
				} else {
					stream.push(
						encoder.encode(
							JSON.stringify({
								text: i.toString(),
							}),
						),
					);
				}
			}

			await cohereStream(call);

			await wait(2000);

			expect(call.write).toHaveBeenCalled();

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
						requestTokensCount: 2,
						responseTokensCount: 2,
					},
				],
			]);

			expect(mockTokenize).toHaveBeenNthCalledWith(1, {
				model: 'command',
				text: 'test',
			});

			expect(mockTokenize).toHaveBeenNthCalledWith(2, {
				model: 'command',
				text: '0123456789',
			});
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

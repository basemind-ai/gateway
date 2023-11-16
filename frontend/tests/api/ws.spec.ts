/* eslint-disable @typescript-eslint/no-empty-function */
import { faker } from '@faker-js/faker';
import { Server } from 'mock-socket';
import { wait } from 'shared/time';
import { mockFetch } from 'tests/mocks';

import {
	createWebsocket,
	createWebsocketURL,
	handleCreateOTP,
	PING_INTERVAL,
} from '@/api/ws';
import { HttpMethod } from '@/constants';
import {
	ModelVendor,
	OpenAIModelType,
	PromptConfigTest,
	PromptConfigTestResultChunk,
} from '@/types';

describe('prompt testing websocket', () => {
	const baseURL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;

	afterEach(() => {
		process.env.NEXT_PUBLIC_BACKEND_BASE_URL = baseURL;
	});

	describe('handleCreateOTP', () => {
		it('returns an OTP', async () => {
			const otp = { otp: 'abc' };
			const projectId = '123';
			mockFetch.mockResolvedValueOnce({
				json: () => Promise.resolve(otp),
				ok: true,
			});
			const data = await handleCreateOTP({ projectId });

			expect(data).toEqual(otp);
			expect(mockFetch).toHaveBeenCalledWith(
				new URL('http://www.example.com/v1/projects/123/otp/'),
				{
					headers: {
						'Authorization': 'Bearer test_token',
						'Content-Type': 'application/json',
						'X-Request-Id': expect.any(String),
					},
					method: HttpMethod.Get,
				},
			);
		});
	});
	describe('createWebsocketURL', () => {
		it('returns the expected URL string', () => {
			process.env.NEXT_PUBLIC_BACKEND_BASE_URL = 'http://www.example.com';

			expect(
				createWebsocketURL({
					applicationId: '123',
					otp: 'abc',
					projectId: '456',
				}),
			).toBe(
				'ws://www.example.com/v1/projects/456/applications/123/prompt-configs/test/?otp=abc',
			);
		});
	});
	describe('createWebsocket', () => {
		const otp = faker.string.uuid();
		const projectId = faker.string.uuid();
		const applicationId = faker.string.uuid();

		const wsData = {
			modelParameters: {},
			modelType: OpenAIModelType.Gpt35Turbo,
			modelVendor: ModelVendor.OpenAI,
			name: 'test',
			promptConfigId: undefined,
			promptMessages: [],
			templateVariables: {},
		} satisfies PromptConfigTest<any>;

		beforeEach(() => {
			mockFetch.mockResolvedValueOnce({
				json: () => Promise.resolve({ otp }),
				ok: true,
			});
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it('sends the expected ping on websocket open', async () => {
			vi.useFakeTimers({ shouldAdvanceTime: true });

			process.env.NEXT_PUBLIC_BACKEND_BASE_URL = 'http://localhost:8080';

			const mockServerURL = createWebsocketURL({
				applicationId,
				otp,
				projectId,
			});
			const mockServer = new Server(mockServerURL);

			let ping: any;

			mockServer.on('connection', (socket) => {
				socket.on('message', (data) => {
					ping = data;
				});
			});

			await createWebsocket({
				applicationId,
				handleClose: () => {},
				handleError: () => {},
				handleMessage: () => {},
				projectId,
			});

			while (!ping) {
				vi.advanceTimersByTime(PING_INTERVAL);
				await wait(100);
			}
			expect(ping).toBe('ping');

			mockServer.stop();
		});

		it('sends the expected data', async () => {
			process.env.NEXT_PUBLIC_BACKEND_BASE_URL = 'http://localhost:8080';

			const mockServerURL = createWebsocketURL({
				applicationId,
				otp,
				projectId,
			});
			const mockServer = new Server(mockServerURL);

			let message: any;

			mockServer.on('connection', (socket) => {
				socket.on('message', (data) => {
					message = data;
				});
			});

			const { sendMessage } = await createWebsocket({
				applicationId,
				handleClose: () => {},
				handleError: () => {},
				handleMessage: () => {},
				projectId,
			});

			await sendMessage(wsData);

			while (!message) {
				await wait(100);
			}

			expect(message).toEqual(JSON.stringify(wsData));

			mockServer.stop();
		});

		it('receives the expected data', async () => {
			process.env.NEXT_PUBLIC_BACKEND_BASE_URL = 'http://localhost:8080';

			const mockServerURL = createWebsocketURL({
				applicationId,
				otp,
				projectId,
			});
			const mockServer = new Server(mockServerURL);

			let message: any;

			mockServer.on('connection', (socket) => {
				socket.send(JSON.stringify(wsData));
			});

			const handleMessage = (
				event: MessageEvent<PromptConfigTestResultChunk>,
			) => {
				message = event;
			};

			await createWebsocket({
				applicationId,
				handleClose: () => {},
				handleError: () => {},
				handleMessage,
				projectId,
			});

			while (!message) {
				await wait(100);
			}

			expect(message.data).toEqual(wsData);

			mockServer.stop();
		});

		it('throws an error if the websocket is closed', async () => {
			process.env.NEXT_PUBLIC_BACKEND_BASE_URL = 'http://localhost:8080';

			const mockServerURL = createWebsocketURL({
				applicationId,
				otp,
				projectId,
			});
			const mockServer = new Server(mockServerURL);

			let isRunning = true;

			mockServer.on('close', () => {
				isRunning = false;
			});

			const { sendMessage } = await createWebsocket({
				applicationId,
				handleClose: () => {},
				handleError: () => {},
				handleMessage: () => {},
				projectId,
			});

			mockServer.close();

			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
			while (isRunning) {
				await wait(100);
			}

			await expect(sendMessage(wsData)).rejects.toThrow();
		});

		it('closes the websocket connection', async () => {
			process.env.NEXT_PUBLIC_BACKEND_BASE_URL = 'http://localhost:8080';

			const mockServerURL = createWebsocketURL({
				applicationId,
				otp,
				projectId,
			});
			const mockServer = new Server(mockServerURL);

			let isRunning = true;

			mockServer.on('close', () => {
				isRunning = false;
			});

			const { closeSocket } = await createWebsocket({
				applicationId,
				handleClose: () => {},
				handleError: () => {},
				handleMessage: () => {},
				projectId,
			});

			closeSocket();

			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
			while (isRunning) {
				await wait(100);
			}

			expect(isRunning).toBe(false);
		});
	});
});

import { faker } from '@faker-js/faker';
import { PromptTestRecordFactory } from 'tests/factories';
import { mockFetch } from 'tests/mocks';
import { act, renderHook, waitFor } from 'tests/test-utils';
import { MockInstance } from 'vitest';

import * as ws from '@/api/ws';
import { WebsocketHandler } from '@/api/ws';
import { usePromptTesting } from '@/hooks/use-prompt-testing';
import { ModelVendor, OpenAIModelType, PromptConfigTest } from '@/types';

describe('usePromptTesting tests', () => {
	const projectId = faker.string.uuid();
	const applicationId = faker.string.uuid();

	const wsData = {
		modelParameters: {},
		modelType: OpenAIModelType.Gpt35Turbo,
		modelVendor: ModelVendor.OpenAI,
		promptConfigId: undefined,
		promptMessages: [],
		templateVariables: {},
	} satisfies PromptConfigTest<any>;

	const promptTestRecord = PromptTestRecordFactory.buildSync();

	const mockWebsocketHandler = {
		closeSocket: vi.fn(),
		isClosed: vi.fn().mockReturnValue(false),
		sendMessage: vi.fn(),
	} satisfies WebsocketHandler<any>;

	let createWebsocketSpy: MockInstance;
	beforeEach(() => {
		createWebsocketSpy = vi
			.spyOn(ws, 'createWebsocket')
			.mockResolvedValue(mockWebsocketHandler as any);
	});

	it('establishes a websocket connection', () => {
		renderHook(() =>
			usePromptTesting({
				applicationId,
				onError: vi.fn(),
				onFinish: vi.fn(),
				projectId,
			}),
		);
		expect(createWebsocketSpy).toHaveBeenCalledWith({
			applicationId,
			handleClose: expect.any(Function),
			handleError: expect.any(Function),
			handleMessage: expect.any(Function),
			projectId,
		});
	});

	it('returns the expected values', () => {
		const { result } = renderHook(() =>
			usePromptTesting({
				applicationId,
				onError: vi.fn(),
				onFinish: vi.fn(),
				projectId,
			}),
		);
		expect(result.current).toEqual({
			isReady: true,
			isRunningTest: false,
			modelResponses: [],
			resetState: expect.any(Function),
			sendMessage: expect.any(Function),
			testFinishReason: null,
			testRecord: null,
		});
	});

	it('sends message and updates state', async () => {
		const { result } = renderHook(() =>
			usePromptTesting({
				applicationId,
				onError: vi.fn(),
				onFinish: vi.fn(),
				projectId,
			}),
		);
		await waitFor(() => {
			expect(result.current.isReady).toBeTruthy();
		});
		act(() => {
			result.current.sendMessage(wsData);
		});
		await waitFor(() => {
			expect(mockWebsocketHandler.sendMessage).toHaveBeenCalled();
		});

		expect(result.current.isRunningTest).toBeTruthy();
	});

	it('updates model response when a message is sent via the websocket', async () => {
		const { result } = renderHook(() =>
			usePromptTesting({
				applicationId,
				onError: vi.fn(),
				onFinish: vi.fn(),
				projectId,
			}),
		);
		await waitFor(() => {
			expect(result.current.isReady).toBeTruthy();
		});

		const { handleMessage } = createWebsocketSpy.mock.calls[0][0];

		act(() => {
			handleMessage({ data: { content: 'test' } });
		});
		expect(result.current.modelResponses).toEqual([{ content: 'test' }]);
	});

	it('updates the state and retrieves the test record from the backend when finishReason is not empty', async () => {
		mockFetch.mockResolvedValueOnce({
			json: () => Promise.resolve(promptTestRecord),
			ok: true,
		});

		const { result } = renderHook(() =>
			usePromptTesting({
				applicationId,
				onError: vi.fn(),
				onFinish: vi.fn(),
				projectId,
			}),
		);
		await waitFor(() => {
			expect(result.current.isReady).toBeTruthy();
		});

		const { handleMessage } = createWebsocketSpy.mock.calls[0][0];

		act(() => {
			handleMessage({
				data: {
					finishReason: 'done',
					promptTestRecordId: promptTestRecord.id,
				},
			});
		});
		await waitFor(() => {
			expect(result.current.testRecord).toEqual(promptTestRecord);
		});

		expect(mockFetch).toHaveBeenCalled();
		expect(result.current.isRunningTest).toBeFalsy();
	});

	it('calls closeSocket when unloading', async () => {
		const { result, unmount } = renderHook(() =>
			usePromptTesting({
				applicationId,
				onError: vi.fn(),
				onFinish: vi.fn(),
				projectId,
			}),
		);

		await waitFor(() => {
			expect(result.current.isReady).toBeTruthy();
		});

		act(() => {
			unmount();
		});

		await waitFor(() => {
			expect(mockWebsocketHandler.closeSocket).toHaveBeenCalled();
		});
	});

	it('resets state when resetState is called', async () => {
		const { result } = renderHook(() =>
			usePromptTesting({
				applicationId,
				onError: vi.fn(),
				onFinish: vi.fn(),
				projectId,
			}),
		);

		act(() => {
			result.current.resetState();
		});

		expect(result.current.isRunningTest).toBeFalsy();
		expect(result.current.modelResponses).toEqual([]);
		expect(result.current.testFinishReason).toBeNull();
		expect(result.current.testRecord).toBeNull();
	});

	it('calls handleRefreshProject when a testRecordId is present', async () => {
		mockFetch.mockResolvedValueOnce({
			json: () => Promise.resolve(promptTestRecord),
			ok: true,
		});

		const handleRefreshProject = vi.fn();

		const { result } = renderHook(() =>
			usePromptTesting({
				applicationId,
				onError: vi.fn(),
				onFinish: handleRefreshProject,
				projectId,
			}),
		);
		await waitFor(() => {
			expect(result.current.isReady).toBeTruthy();
		});

		const { handleMessage } = createWebsocketSpy.mock.calls[0][0];

		act(() => {
			handleMessage({
				data: {
					finishReason: 'done',
					promptTestRecordId: promptTestRecord.id,
				},
			});
		});
		await waitFor(() => {
			expect(result.current.testRecord).toEqual(promptTestRecord);
		});

		expect(mockFetch).toHaveBeenCalled();

		expect(handleRefreshProject).toHaveBeenCalled();
	});
});

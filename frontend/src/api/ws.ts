import { wait } from 'shared/time';

import { fetcher } from '@/api/fetcher';
import { HttpMethod } from '@/constants';
import { OTP, PromptConfigTest, PromptConfigTestResultChunk } from '@/types';

export const WS_STATUS_OK = 1000;
export const PING_INTERVAL = 15_000;

export async function handleCreateOTP({
	projectId,
}: {
	projectId: string;
}): Promise<OTP> {
	return await fetcher<OTP>({
		url: `projects/${projectId}/otp/`,
		method: HttpMethod.Get,
	});
}

export function createWebsocketURL({
	otp,
	applicationId,
	projectId,
}: {
	otp: string;
	applicationId: string;
	projectId: string;
}): string {
	const url = new URL(
		`v1/projects/${projectId}/applications/${applicationId}/prompt-configs/test/`,
		process.env.NEXT_PUBLIC_BACKEND_BASE_URL,
	);

	url.search = new URLSearchParams({ otp }).toString();
	url.protocol = url.protocol.replace('http', 'ws');

	return url.toString();
}

export interface WebsocketHandler<P, M> {
	closeSocket: () => void;
	sendMessage: (message: PromptConfigTest<P, M>) => Promise<void>;
}

export async function createWebsocket<P, M>({
	applicationId,
	projectId,
	handleClose,
	handleMessage,
	handleError,
}: {
	projectId: string;
	applicationId: string;
	handleClose: (isError: boolean, reason: string) => void;
	handleMessage: (event: MessageEvent<PromptConfigTestResultChunk>) => void;
	handleError: (event: Event) => void;
}): Promise<WebsocketHandler<P, M>> {
	// we need to create an OTP to access the websocket.
	// The OTP is valid for one minute and it should be sent as a query param.
	const { otp } = await handleCreateOTP({ projectId });
	const url = createWebsocketURL({ otp, applicationId, projectId });
	const websocket = new WebSocket(url);

	let pingInterval: NodeJS.Timeout;

	websocket.addEventListener('open', () => {
		if (websocket.readyState === WebSocket.OPEN) {
			pingInterval = setInterval(() => {
				if (websocket.readyState === WebSocket.OPEN) {
					websocket.send('ping');
				}
			}, PING_INTERVAL);
		}
	});
	websocket.addEventListener('close', ({ code, reason }) => {
		clearInterval(pingInterval);
		handleClose(code !== WS_STATUS_OK, reason);
	});
	websocket.addEventListener('error', handleError);
	websocket.addEventListener('message', (event: MessageEvent<string>) => {
		const data = JSON.parse(event.data) as PromptConfigTestResultChunk;
		handleMessage({ ...event, data });
	});

	return {
		closeSocket: () => {
			clearInterval(pingInterval);
			websocket.close(WS_STATUS_OK, 'user action');
		},
		sendMessage: async (message: PromptConfigTest<P, M>) => {
			if (
				websocket.readyState === WebSocket.CLOSED ||
				websocket.readyState === WebSocket.CLOSING
			) {
				throw new Error('websocket is closed');
			}

			while (websocket.readyState === WebSocket.CONNECTING) {
				await wait(100);
			}

			if (websocket.readyState === WebSocket.OPEN) {
				websocket.send(JSON.stringify(message));
			}
		},
	};
}

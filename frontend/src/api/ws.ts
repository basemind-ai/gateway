import { fetcher } from '@/api/fetcher';
import { HttpMethod } from '@/constants';
import { OTP, PromptConfigTestDTO, PromptConfigTestResultChunk } from '@/types';

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

export async function createWebsocket<
	P extends Record<string, string | number> = Record<string, string | number>,
	M extends Record<string, string | number> = Record<string, string | number>,
>({
	applicationId,
	projectId,
	data,
	handleClose,
	handleMessage,
	handleError,
}: {
	projectId: string;
	applicationId: string;
	data: PromptConfigTestDTO<P, M>;
	handleClose: (event: CloseEvent) => void;
	handleMessage: (event: MessageEvent<PromptConfigTestResultChunk>) => void;
	handleError: (event: Event) => void;
}) {
	// we need to create an OTP to access the websocket.
	// The OTP is valid for one minute and it should be sent as a query param.
	const { otp } = await handleCreateOTP({ projectId });

	const websocket = new WebSocket(
		`projects/${projectId}/applications/${applicationId}/prompt-configs/test/?otp=${otp}`,
	);

	websocket.addEventListener('open', () => {
		if (websocket.readyState === WebSocket.OPEN) {
			websocket.send(JSON.stringify(data));
		}
	});
	websocket.addEventListener('message', handleMessage);
	websocket.addEventListener('close', handleClose);
	websocket.addEventListener('error', handleError);

	return websocket;
}

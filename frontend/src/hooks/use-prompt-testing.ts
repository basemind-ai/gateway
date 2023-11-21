import { useCallback, useEffect, useState } from 'react';

import { createWebsocket, WebsocketHandler } from '@/api';
import { handleRetrievePromptTestRecordById } from '@/api/prompt-test-record-api';
import {
	ModelVendor,
	PromptConfigTest,
	PromptConfigTestResultChunk,
	PromptTestRecord,
} from '@/types';

/*
 * usePromptTesting wraps the logic for establishing a websocket and running prompt config testing using it.
 *
 * The test flow is as follows:
 *
 * 1. websocket connection is established.
 * 2. the user provides the prompt template and any required template variables.
 * 3. the frontend sends an instance of PromptConfigTest that includes this data and all the other configurations.
 * 4. the backend starts the test and streams back the results in chunks.
 * 5. the frontend receives the results and updates the UI accordingly.
 * 6. the backend sends a final chunk with the finishReason and the promptTestRecordId.
 * 7. the frontend sends a REST request to retrieve the promptTestRecord row from the DB.
 * 8. the frontend displays the results of the test.
 *
 * */
export function usePromptTesting<T extends ModelVendor>({
	applicationId,
	projectId,
	handleError,
}: {
	applicationId: string;
	handleError: () => void;
	projectId: string;
}): {
	isReady: boolean;
	isRunningTest: boolean;
	modelResponses: PromptConfigTestResultChunk[];
	resetState: () => void;
	sendMessage: (testConfig: PromptConfigTest<T>) => Promise<void>;
	testFinishReason: string;
	testRecord: PromptTestRecord<T> | null;
} {
	const [testFinishReason, setTestFinishReason] = useState('');
	const [promptTestRecordId, setPromptTestRecordId] = useState<
		string | undefined
	>(undefined);
	const [modelResponses, setModelResponses] = useState<
		PromptConfigTestResultChunk[]
	>([]);
	const [isRunningTest, setIsRunningTest] = useState(false);

	const [testRecord, setTestRecord] = useState<PromptTestRecord<T> | null>(
		null,
	);
	const [websocketHandler, setWebsocketHandler] =
		useState<null | WebsocketHandler<T>>(null);

	const handlerRef: { value: null | WebsocketHandler<T> } = { value: null };

	useEffect(() => {
		resetState();
		(async () => {
			const handler = (handlerRef.value = await createWebsocket<T>({
				applicationId,
				/* c8 ignore start */
				handleClose: () => {
					setWebsocketHandler(null);
				},
				/* c8 ignore end */
				handleError,
				handleMessage: ({
					data,
				}: MessageEvent<PromptConfigTestResultChunk>) => {
					if (data.finishReason) {
						setIsRunningTest(false);
						setTestFinishReason(data.finishReason);
						setPromptTestRecordId(data.promptTestRecordId);
					}
					setModelResponses((oldResults) => [...oldResults, data]);
				},
				projectId,
			}));
			setWebsocketHandler(handler);
		})();

		return () => {
			handlerRef.value?.closeSocket();
		};
	}, [applicationId, projectId]);

	useEffect(() => {
		if (promptTestRecordId) {
			(async () => {
				const testRecord = await handleRetrievePromptTestRecordById<T>({
					applicationId,
					projectId,
					promptTestRecordId,
				});
				setTestRecord(testRecord);
			})();
		}
	}, [promptTestRecordId, applicationId, projectId]);

	const resetState = useCallback(() => {
		setIsRunningTest(false);
		setModelResponses([]);
		setTestFinishReason('');
		setTestRecord(null);
	}, []);

	const sendMessage = async (testConfig: PromptConfigTest<T>) => {
		setIsRunningTest(true);
		setModelResponses([]);

		await websocketHandler?.sendMessage(testConfig);
	};

	return {
		isReady: !!websocketHandler,
		isRunningTest,
		modelResponses,
		resetState,
		sendMessage,
		testFinishReason,
		testRecord,
	};
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { StreamFinishReason } from 'shared/constants';

import { createWebsocket, WebsocketHandler } from '@/api';
import { handleRetrievePromptTestRecordById } from '@/api/prompt-test-record-api';
import { WebsocketError } from '@/errors';
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
	onError,
	onFinish,
}: {
	applicationId: string;
	onError: (errorMessage: string) => void;
	onFinish: () => Promise<void>;
	projectId: string;
}): {
	isReady: boolean;
	isRunningTest: boolean;
	modelResponses: PromptConfigTestResultChunk[];
	resetState: () => void;
	sendMessage: (testConfig: PromptConfigTest<T>) => Promise<void>;
	testFinishReason: StreamFinishReason | null;
	testRecord: PromptTestRecord<T> | null;
} {
	const [testFinishReason, setTestFinishReason] =
		useState<StreamFinishReason | null>(null);
	const [modelResponses, setModelResponses] = useState<
		PromptConfigTestResultChunk[]
	>([]);
	const [isRunningTest, setIsRunningTest] = useState(false);
	const [testRecord, setTestRecord] = useState<PromptTestRecord<T> | null>(
		null,
	);
	const handlerRef = useRef<WebsocketHandler<T> | null>(null);

	const handleMessage = useCallback(
		({ data }: MessageEvent<PromptConfigTestResultChunk>) => {
			if (data.finishReason) {
				setIsRunningTest(false);
				setTestFinishReason(data.finishReason as StreamFinishReason);

				(async () => {
					const [record] = await Promise.all([
						handleRetrievePromptTestRecordById<T>({
							applicationId,
							projectId,
							promptTestRecordId: data.promptTestRecordId!,
						}),
						onFinish(),
					]);

					setTestRecord(record);
				})();
			}
			setModelResponses((oldResults) => [...oldResults, data]);
		},
		[applicationId, projectId, onFinish],
	);

	const handleClose = useCallback(
		(isError: boolean, reason: string) => {
			if (isError) {
				onError(reason);
			}
			if (isRunningTest) {
				setIsRunningTest(false);
				setTestFinishReason(isError ? StreamFinishReason.ERROR : null);
			}
			handlerRef.current = null;
		},
		[onError, isRunningTest],
	);

	const handleError = useCallback(
		(error: WebsocketError) => {
			setIsRunningTest(false);
			setTestFinishReason(StreamFinishReason.ERROR);
			onError(error.message);
		},
		[onError],
	);

	const resetState = useCallback(() => {
		setIsRunningTest(false);
		setModelResponses([]);
		setTestFinishReason(null);
		setTestRecord(null);
	}, []);

	useEffect(() => {
		resetState();

		(async () => {
			handlerRef.current = await createWebsocket<T>({
				applicationId,
				handleClose,
				handleError,
				handleMessage,
				projectId,
			});
		})();

		return () => {
			handlerRef.current?.closeSocket();
			handlerRef.current = null;
		};
	}, [
		applicationId,
		projectId,
		handleClose,
		handleError,
		handleMessage,
		resetState,
	]);

	const sendMessage = async (testConfig: PromptConfigTest<T>) => {
		if (handlerRef.current?.isClosed()) {
			resetState();

			handlerRef.current = await createWebsocket<T>({
				applicationId,
				handleClose,
				handleError,
				handleMessage,
				projectId,
			});
		}

		setIsRunningTest(true);
		setModelResponses([]);

		await handlerRef.current?.sendMessage(testConfig);
	};

	return {
		isReady: !handlerRef.current?.isClosed(),
		isRunningTest,
		modelResponses,
		resetState,
		sendMessage,
		testFinishReason,
		testRecord,
	};
}

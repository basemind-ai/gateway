'use client';

import { useEffect, useState } from 'react';

import { createWebsocket, WebsocketHandler } from '@/api/ws';
import {
	ModelType,
	ModelVendor,
	OpenAIModelParameters,
	OpenAIPromptMessage,
	PromptConfigTestResultChunk,
} from '@/types';
import { handleChange } from '@/utils/helpers';

export default function PromptTesting({
	params: { projectId, applicationId },
}: {
	params: { projectId: string; applicationId: string };
}) {
	const [isError, setIsError] = useState(false);
	const [isClosed, setIsClosed] = useState(false);
	const [messages, setMessages] = useState<PromptConfigTestResultChunk[]>([]);
	const [prompt, setPrompt] = useState<string>('');
	const [websocketHandler, setWebsocketHandler] =
		useState<null | WebsocketHandler<
			OpenAIModelParameters,
			OpenAIPromptMessage
		>>(null);

	const closeWebsocket = () => {
		websocketHandler?.closeSocket();
		setIsClosed(true);
	};

	const sendMessage = () => {
		void websocketHandler?.sendMessage({
			name: `test${new Date().toISOString()}`,
			modelParameters: {},
			modelType: ModelType.Gpt35Turbo,
			modelVendor: ModelVendor.OpenAI,
			promptMessages: [
				{ role: 'user', content: prompt, templateVariables: [] },
			],
			templateVariables: {},
			promptConfigId: undefined,
		});
	};

	useEffect(() => {
		(async () => {
			const handler = await createWebsocket<
				OpenAIModelParameters,
				OpenAIPromptMessage
			>({
				applicationId,
				projectId,
				handleMessage: ({ data }) => {
					setMessages((messages) => [...messages, data]);
				},
				handleClose: (isError, reason) => {
					console.log('closing connection', isError, reason);
					setIsClosed(true);
					setIsError(isError);
				},
				handleError: (event) => {
					console.log('err', event);
					setIsError(true);
				},
			});
			setWebsocketHandler(handler);
		})();
	}, []);

	if (!websocketHandler) {
		return null;
	}

	return (
		<div className="container">
			<div className="accent-red-50">{isError && 'websocket error'}</div>
			<div className="accent-red-50">
				{isClosed && 'websocket is closed'}
			</div>
			<h1>messages received:</h1>
			<div className="w-full h-full flex flex-col justify-evenly min-h-16 border-2">
				{messages.map((message, index) => (
					<div key={index}>
						<div>{`content: ${message.content}`}</div>
						<div>{`error: ${message.errorMessage}`}</div>
						<div>
							{`promptTestRecordId: ${message.promptTestRecordId}`}
						</div>
						<div>{`finishReason: ${message.finishReason}`}</div>
						<div>{`promptConfigId: ${message.promptConfigId}`}</div>
					</div>
				))}
			</div>
			<div className="divider" />
			<div className="p-4">
				<label className="label">Enter a prompt:</label>
				<textarea
					className="textarea textarea-bordered textarea-primary min-w-[50%]"
					value={prompt}
					onChange={handleChange(setPrompt)}
				/>
			</div>
			<div className="join p-4">
				<button
					className="btn rounded-btn btn-secondary join-item"
					onClick={closeWebsocket}
					disabled={isClosed || !websocketHandler}
				>
					Close Websocket
				</button>
				<button
					className="btn rounded-btn btn-primary join-item"
					onClick={sendMessage}
					disabled={!prompt || isClosed || !websocketHandler}
				>
					Submit
				</button>
			</div>
		</div>
	);
}

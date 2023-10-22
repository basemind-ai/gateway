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

	if (!websocketHandler) {
		return null;
	}

	const closeWebsocket = () => {
		websocketHandler.closeSocket();
		setIsClosed(true);
	};

	const sendMessage = () => {
		void websocketHandler.sendMessage({
			name: 'test',
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
				handleClose: () => {
					setIsClosed(true);
				},
				handleError: () => {
					setIsError(true);
				},
			});
			setWebsocketHandler(handler);
		})();
	}, []);

	return (
		<div className="container">
			<div className="accent-red-50">{isError && 'websocket error'}</div>
			<div className="accent-red-50">
				{isClosed && 'websocket is closed'}
			</div>
			<div className="w-full h-full flex flex-col justify-evenly">
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
			<div>
				<label>Enter a prompt</label>
				<input
					type="text"
					className="input"
					value={prompt}
					onChange={handleChange(setPrompt)}
				/>
			</div>
			<div className="flex justify-between">
				<button
					className="btn rounded-btn btn-secondary"
					onClick={closeWebsocket}
				>
					Close Websocket
				</button>
				<button
					className="btn rounded-btn btn-secondary"
					onClick={sendMessage}
					disabled={!prompt}
				>
					Submit
				</button>
			</div>
		</div>
	);
}

import React, { useEffect, useState } from 'react';
import { Plus } from 'react-bootstrap-icons';

import { OpenAIMessageForm } from '@/components/prompt-display-components/openai-components/openai-message-form';
import { Dimensions } from '@/constants';
import {
	OpenAIContentMessage,
	OpenAIContentMessageRole,
	OpenAIPromptMessageRole,
} from '@/types';

export function OpenAIPromptTemplateForm({
	messages,
	setMessages,
}: {
	messages: OpenAIContentMessage[];
	setMessages: (messages: OpenAIContentMessage[]) => void;
}) {
	const [formMessages, setFormMessages] = useState(messages);

	const cursor = 'cursor-grabbing';

	useEffect(() => {
		setMessages(
			formMessages.map(({ name, content, role, templateVariables }) => ({
				content,
				name,
				role,
				templateVariables,
			})),
		);
	}, [formMessages]);

	useEffect(() => {
		if (!Object.keys(formMessages).length) {
			setFormMessages([
				{
					content: '',
					role: OpenAIPromptMessageRole.User,
				},
			]);
		}
	}, [formMessages]);

	const handleSetMessageContent = (index: number) => (content: string) => {
		const copiedFormMessages = [...formMessages];
		copiedFormMessages[index].content = content;
		setFormMessages(copiedFormMessages);
	};

	const handleSetMessageName = (index: number) => (name: string) => {
		const copiedFormMessages = [...formMessages];
		copiedFormMessages[index].name = name;
		setFormMessages(copiedFormMessages);
	};

	const handleSetMessageRole =
		(index: number) => (role: OpenAIContentMessageRole) => {
			const copiedFormMessages = [...formMessages];
			copiedFormMessages[index].role = role;
			setFormMessages(copiedFormMessages);
		};

	const handleAddMessage = () => {
		setFormMessages([
			...formMessages,
			{
				content: '',
				role: OpenAIPromptMessageRole.User,
			},
		]);
	};

	const handleDeleteMessage = (index: number) => {
		setFormMessages(formMessages.splice(index, 1));
	};

	const handleArrowUp = (index: number) => {
		const copiedFormMessages = [...formMessages];
		const replaced = copiedFormMessages[index];
		copiedFormMessages[index] = copiedFormMessages[index - 1];
		copiedFormMessages[index - 1] = replaced;
		setFormMessages(copiedFormMessages);
	};

	const handleArrowDown = (index: number) => {
		const copiedFormMessages = [...formMessages];
		const replaced = copiedFormMessages[index];
		copiedFormMessages[index] = copiedFormMessages[index + 1];
		copiedFormMessages[index + 1] = replaced;
		setFormMessages(copiedFormMessages);
	};

	return (
		<div data-testid="openai-prompt-template-form">
			<div className={`flex flex-col gap-4 ${cursor}`}>
				{Object.entries(formMessages).map(([id, message], i) => (
					<OpenAIMessageForm
						key={id}
						id={id}
						content={message.content}
						name={message.name}
						role={message.role}
						setContent={handleSetMessageContent(i)}
						setName={handleSetMessageName(i)}
						setRole={handleSetMessageRole(i)}
						handleDeleteMessage={() => {
							handleDeleteMessage(i);
						}}
						showArrowDown={
							formMessages.length > 1 &&
							i !== formMessages.length - 1
						}
						showArrowUp={formMessages.length > 1 && i !== 0}
						handleArrowDown={() => {
							handleArrowDown(i);
						}}
						handleArrowUp={() => {
							handleArrowUp(i);
						}}
					/>
				))}
				<div className="self-center">
					<button
						className="btn btn-ghost text-blue-500"
						onClick={handleAddMessage}
					>
						<Plus height={Dimensions.Ten} width={Dimensions.Ten} />
					</button>
				</div>
			</div>
		</div>
	);
}

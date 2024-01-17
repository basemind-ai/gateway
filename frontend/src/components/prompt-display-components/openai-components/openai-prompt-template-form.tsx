import React, { useEffect, useState } from 'react';
import { Plus } from 'react-bootstrap-icons';

import { OpenAIMessageForm } from '@/components/prompt-display-components/openai-components/openai-message-form';
import { Dimensions } from '@/constants';
import {
	OpenAIContentMessageRole,
	OpenAIPromptMessage,
	OpenAIPromptMessageRole,
} from '@/types';
import { extractTemplateVariables } from '@/utils/models';

export function OpenAIPromptTemplateForm({
	messages,
	setMessages,
}: {
	messages: OpenAIPromptMessage[];
	setMessages: (messages: OpenAIPromptMessage[]) => void;
}) {
	const cursor = 'cursor-grabbing';

	const [formMessages, setFormMessages] = useState([...messages]);

	useEffect(() => {
		if (!formMessages.length) {
			setFormMessages([
				{
					content: '',
					role: OpenAIPromptMessageRole.User,
				},
			]);
		}
	}, [formMessages]);

	useEffect(() => {
		setMessages([...formMessages]);
	}, [setMessages, formMessages]);

	const handleSetMessageContent = (index: number) => (content: string) => {
		const copied = [...formMessages];
		copied[index].content = content;
		copied[index].templateVariables = extractTemplateVariables(content);

		setFormMessages(copied);
	};

	const handleSetMessageName = (index: number) => (name: string) => {
		const copied = [...formMessages];
		copied[index].name = name;

		setFormMessages(copied);
	};

	const handleSetMessageRole =
		(index: number) => (role: OpenAIContentMessageRole) => {
			const copied = [...formMessages];
			copied[index].role = role;

			setFormMessages(copied);
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
		setFormMessages(formMessages.toSpliced(index, 1));
	};

	const handleArrowUp = (index: number) => {
		const copied = [...formMessages];
		const replaced = copied[index];
		copied[index] = copied[index - 1];
		copied[index - 1] = replaced;
		setFormMessages(copied);
	};

	const handleArrowDown = (index: number) => {
		const copied = [...formMessages];
		const replaced = copied[index];
		copied[index] = copied[index + 1];
		copied[index + 1] = replaced;
		setFormMessages(copied);
	};

	return (
		<div data-testid="openai-prompt-template-form">
			<div className={`flex flex-col gap-4 ${cursor}`}>
				{formMessages.map((message, i) => (
					<OpenAIMessageForm
						key={i}
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
						data-testid="openai-prompt-template-form-add-message-button"
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

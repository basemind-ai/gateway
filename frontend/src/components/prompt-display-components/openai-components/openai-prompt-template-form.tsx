import { useTranslations } from 'next-intl';
import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, XCircle } from 'react-bootstrap-icons';

import { Dimensions } from '@/constants';
import { openAIRoleColorMap } from '@/constants/models';
import {
	OpenAIContentMessage,
	OpenAIContentMessageRole,
	OpenAIPromptMessageRole,
} from '@/types';
import { handleChange } from '@/utils/events';

export function OpenAIMessageForm({
	id,
	role,
	setRole,
	name,
	setName,
	content,
	setContent,
	handleDeleteMessage,
	handleArrowUp,
	handleArrowDown,
	showArrowUp,
	showArrowDown,
}: {
	content: string;
	handleArrowDown: () => void;
	handleArrowUp: () => void;
	handleDeleteMessage: (id: string) => void;
	id: string;
	name?: string;
	role: OpenAIContentMessageRole;
	setContent: (content: string) => void;
	setName: (name: string) => void;
	setRole: (role: OpenAIContentMessageRole) => void;
	showArrowDown: boolean;
	showArrowUp: boolean;
}) {
	const t = useTranslations('openaiPromptTemplate');

	const roleColor = `text-${openAIRoleColorMap[role]}`;

	return (
		<div
			data-test-it={`openai-message-container-${id}`}
			className="rounded-dark-card flex cursor-grab"
		>
			<div
				className={`flex flex-col justify-${
					showArrowUp ? 'between' : 'end'
				} items-center pr-2`}
			>
				{showArrowUp && (
					<button
						className="btn btn-ghost p-0 text-accent/70 hover:text-accent ${showArrowUp ?'' : 'hidden'}}"
						onClick={handleArrowUp}
					>
						<ArrowUp height={Dimensions.Five} />
					</button>
				)}
				{showArrowDown && (
					<button
						className="btn btn-ghost p-0 text-accent/70 hover:text-accent "
						onClick={handleArrowDown}
					>
						<ArrowDown height={Dimensions.Five} />
					</button>
				)}
			</div>
			<div
				className={`grow p-3 border-2 rounded border-neutral border-opacity-50 border-double hover:border-opacity-100 flex gap-4`}
			>
				<div className="flex flex-col gap-2">
					<div className="form-control" data-no-dnd="true">
						<label
							className="label"
							data-testid="openai-message-new-message-role-label"
						>
							<span className="label-text">
								{t('messageRole')}
							</span>
						</label>
						<select
							className={`select select-bordered select-sm rounded bg-neutral ${roleColor} text-xs`}
							value={role}
							onChange={handleChange(setRole)}
							data-test-it={`openai-message-role-select-${id}`}
						>
							{Object.entries(OpenAIPromptMessageRole)
								.filter(
									(v) =>
										v[1] !==
										OpenAIPromptMessageRole.Function,
								)
								.map(([key, value]) => (
									<option
										key={value}
										id={value}
										value={value}
									>
										{`${key} ${t('message')}`}
									</option>
								))}
						</select>
					</div>
					<div className="form-control" data-no-dnd="true">
						<label
							className="label"
							data-testid="openai-message-new-message-name-label"
						>
							<span className="label-text">
								{t('messageName')}
							</span>
							<span className="label-text-alt">
								{t('optional')}
							</span>
						</label>
						<input
							type="text"
							placeholder={t('messageNameInputPlaceholder')}
							className="input input-bordered input-sm rounded bg-neutral text-neutral-content text-xs"
							data-test-it={`openai-message-name-input-${id}`}
							value={name ?? ''}
							onChange={handleChange(setName)}
						/>
					</div>
				</div>
				<div
					className="form-control grow min-h-full"
					data-no-dnd="true"
				>
					<label
						className="label"
						data-testid="openai-message-new-message-content-label"
					>
						<span className="label-text">
							{t('messageContent')}
						</span>
						<span
							className="text-info label-text-alt text-sm"
							data-testid="openai-message-wrap-variable-label"
						>
							{t('wrapVariable')}
						</span>
					</label>
					<textarea
						className="textarea rounded bg-neutral text-neutral-content h-full min-h-fit"
						placeholder={t('promptMessagePlaceholder')}
						value={content}
						onChange={handleChange(setContent)}
						data-test-it={`openai-message-content-textarea-${id}`}
					/>
				</div>
			</div>
			<button
				className="btn btn-ghost self-center text-warning hover:text-error"
				onClick={() => {
					handleDeleteMessage(id);
				}}
			>
				<XCircle height={Dimensions.Four} width={Dimensions.Four} />
			</button>
		</div>
	);
}

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

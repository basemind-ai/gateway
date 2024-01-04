import { closestCenter, useDraggable, useDroppable } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core/dist/types';
import {
	SortableContext,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { nanoid } from 'nanoid';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Plus, XCircle } from 'react-bootstrap-icons';

import { Dimensions } from '@/constants';
import { openAIRoleColorMap } from '@/constants/models';
import { DnDContext } from '@/context/dnd';
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
}: {
	content: string;
	handleDeleteMessage: (id: string) => void;
	id: string;
	name?: string;
	role: OpenAIContentMessageRole;
	setContent: (content: string) => void;
	setName: (name: string) => void;
	setRole: (role: OpenAIContentMessageRole) => void;
}) {
	const t = useTranslations('openaiPromptTemplate');

	const borderColor = `border-${openAIRoleColorMap[role]}`;

	const { attributes, listeners, setNodeRef, transform } = useDraggable({
		id,
	});
	const style = {
		transform: CSS.Translate.toString(transform),
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...listeners}
			{...attributes}
			data-test-it={`openai-message-container-${id}`}
			className="rounded-dark-card flex cursor-grab"
		>
			<div
				className={`w-full p-4 border-2 rounded ${borderColor} border-opacity-50 border-double hover:border-opacity-100 flex gap-4`}
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
							className="select select-bordered select-sm rounded bg-neutral text-neutral-content text-xs"
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
				className="btn btn-ghost self-center text-error"
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
	const { setNodeRef } = useDroppable({
		id: nanoid(),
	});

	const [formMessages, setFormMessages] = useState(
		messages.map((m) => ({ ...m, id: nanoid() })),
	);

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
					id: nanoid(),
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
				id: nanoid(),
				role: OpenAIPromptMessageRole.User,
			},
		]);
	};

	const handleDeleteMessage = (index: number) => {
		setFormMessages(formMessages.splice(index, 1));
	};

	const handleDragEnd = (event: DragEndEvent) => {
		if (event.over) {
			const oldIndex = formMessages.findIndex(
				(el) => el.id === event.active.id,
			);
			const newIndex = formMessages.findIndex(
				(el) => el.id === event.over!.id,
			);

			const replacedMessage = formMessages[newIndex];
			const copiedFormMessages = [...formMessages];

			copiedFormMessages[newIndex] = formMessages[oldIndex];
			copiedFormMessages[oldIndex] = replacedMessage;

			setFormMessages(copiedFormMessages);
		}
	};

	return (
		<div data-testid="openai-prompt-template-form">
			<DnDContext
				collisionDetection={closestCenter}
				onDragEnd={handleDragEnd}
			>
				<SortableContext
					strategy={verticalListSortingStrategy}
					items={Object.keys(formMessages)}
				>
					<div
						className={`flex flex-col gap-4 ${cursor}`}
						ref={setNodeRef}
					>
						{Object.entries(formMessages).map(
							([id, message], i) => (
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
								/>
							),
						)}
						<div className="self-center">
							<button
								className="btn btn-ghost text-blue-500"
								onClick={handleAddMessage}
							>
								<Plus
									height={Dimensions.Ten}
									width={Dimensions.Ten}
								/>
							</button>
						</div>
					</div>
				</SortableContext>
			</DnDContext>
		</div>
	);
}

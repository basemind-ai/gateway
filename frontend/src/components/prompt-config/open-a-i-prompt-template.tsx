import { useTranslations } from 'next-intl';
import { Dispatch, SetStateAction, useState } from 'react';

import {
	ModelVendor,
	OpenAIContentMessage,
	OpenAIPromptMessageRole,
	PromptConfigTest,
} from '@/types';
import {
	extractVariables,
	handleChange,
	updateTemplateVariablesRecord,
} from '@/utils/helpers';

export default function OpenAIPromptTemplate({
	promptTestConfig,
	setPromptTestConfig,
}: {
	promptTestConfig: PromptConfigTest<ModelVendor.OpenAI>;
	setPromptTestConfig: Dispatch<
		SetStateAction<PromptConfigTest<ModelVendor.OpenAI>>
	>;
}) {
	const t = useTranslations('promptTesting');
	const [activeMessage, setActiveMessage] = useState<number>(0);
	const [draftMessage, setDraftMessage] = useState<OpenAIContentMessage>(
		(promptTestConfig.promptMessages[0] as OpenAIContentMessage) ?? {
			content: '',
			role: OpenAIPromptMessageRole.System,
		},
	);
	function handleRoleChange(role: OpenAIPromptMessageRole) {
		setDraftMessage({ ...draftMessage, role });
	}

	function handleMessageClick(index: number, message: OpenAIContentMessage) {
		return () => {
			setActiveMessage(index);
			setDraftMessage(message);
		};
	}

	function handleNameChange(value: string) {
		setDraftMessage({ ...draftMessage, name: value });
	}

	function handleMessageChange(value: string) {
		setDraftMessage({ ...draftMessage, content: value });
	}

	function handleDelete() {
		const newConfig = { ...promptTestConfig };
		newConfig.promptMessages.splice(activeMessage, 1);
		setPromptTestConfig(newConfig);
		setActiveMessage(0);
		setDraftMessage(
			(newConfig.promptMessages[0] as OpenAIContentMessage) ?? {
				content: '',
				role: OpenAIPromptMessageRole.System,
			},
		);
	}

	function handleSave() {
		draftMessage.templateVariables = extractVariables(draftMessage.content);

		const newConfig = { ...promptTestConfig };
		if (activeMessage === promptTestConfig.promptMessages.length) {
			newConfig.promptMessages.push(draftMessage);
		} else {
			newConfig.promptMessages[activeMessage] = draftMessage;
		}
		newConfig.templateVariables = updateTemplateVariablesRecord(
			newConfig.promptMessages,
			newConfig.templateVariables,
		);
		setPromptTestConfig(newConfig);
	}
	return (
		<div
			className="custom-card-px-16 flex flex-col gap-4	"
			data-testid="prompt-template-card"
		>
			<div className="flex items-start content-start gap-4 self-stretch flex-wrap pb-4">
				{promptTestConfig.promptMessages.map((message, index) => (
					<label
						key={index}
						className={`rounded-4xl border border-0.5 text-xs  py-2.5 px-4  ${
							activeMessage === index
								? 'text-secondary border-secondary'
								: 'border-neutral text-base-content'
						}`}
					>
						<input
							type="radio"
							name="promptMessage"
							value={index}
							checked={activeMessage === index}
							onChange={handleMessageClick(
								index,
								message as OpenAIContentMessage,
							)}
							className="hidden"
							data-testid={`prompt-message-${index}`}
						/>
						{message.name ?? message.role + index}
					</label>
				))}
				<label
					key={promptTestConfig.promptMessages.length}
					className={`rounded-4xl border border-0.5 text-xs  py-2.5 px-4  ${
						activeMessage === promptTestConfig.promptMessages.length
							? 'text-secondary border-secondary'
							: 'border-neutral text-base-content'
					}`}
				>
					<input
						type="radio"
						name="promptMessage"
						value={promptTestConfig.promptMessages.length}
						checked={
							activeMessage ===
							promptTestConfig.promptMessages.length
						}
						onChange={handleMessageClick(
							promptTestConfig.promptMessages.length,
							{
								content: '',
								role: OpenAIPromptMessageRole.System,
							},
						)}
						data-testid={'prompt-message-new'}
						className="hidden"
					/>
					{t('newMessage')}
				</label>
			</div>
			<div>
				<div className="flex justify-between items-center">
					<div className="w-full flex gap-6">
						<input
							type="text"
							placeholder="Name this message for internal use"
							className="input input-sm"
							data-testid="prompt-message-name"
							value={draftMessage.name}
							onChange={handleChange(handleNameChange)}
						/>
						<select
							className="select select-sm select-bordered w-1/4 bg-transparent"
							value={draftMessage.role}
							onChange={handleChange(handleRoleChange)}
							data-testid="prompt-message-role"
						>
							{Object.values(OpenAIPromptMessageRole).map(
								(role) => (
									<option key={role} id={role} value={role}>
										{role.charAt(0).toUpperCase() +
											role.slice(1)}
									</option>
								),
							)}
						</select>
					</div>
					<span className="text-info text-sm">
						{t('wrapVariable')}
					</span>
				</div>
			</div>
			<textarea
				className="textarea textarea-bordered w-full h-56 "
				placeholder={t('promptMessagePlaceholder')}
				value={draftMessage.content}
				onChange={handleChange(handleMessageChange)}
				data-testid="prompt-message-editor"
			/>
			<div className=" flex justify-end gap-4">
				<button
					className="btn btn-outline btn-sm btn-error"
					onClick={handleDelete}
					data-testid="prompt-message-delete"
					disabled={
						activeMessage === promptTestConfig.promptMessages.length
					}
				>
					{t('delete')}
				</button>
				<button
					className="btn btn-sm btn-primary"
					onClick={handleSave}
					data-testid="prompt-message-save"
					disabled={!draftMessage.content}
				>
					{t('save')}
				</button>
			</div>
		</div>
	);
}

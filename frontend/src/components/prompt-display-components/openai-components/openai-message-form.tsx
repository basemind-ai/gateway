import { useTranslations } from 'next-intl';
import React, { useState } from 'react';
import { ArrowDown, ArrowUp, XCircle } from 'react-bootstrap-icons';

import { TooltipIcon } from '@/components/input-label-with-tooltip';
import { Dimensions } from '@/constants';
import { openAIRoleColorMap } from '@/constants/models';
import { OpenAIContentMessageRole, OpenAIPromptMessageRole } from '@/types';
import { handleChange } from '@/utils/events';

const messageNameRegex = /^[\w-]{1,64}$/;

export function OpenAIMessageForm({
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
	handleDeleteMessage: () => void;
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

	const [nameIsValid, setNameIsValid] = useState(true);

	const handleSetName = (name: string) => {
		const valid = !name || messageNameRegex.test(name);

		if (valid) {
			setName(name);
		}

		setNameIsValid(valid);
	};

	return (
		<div
			data-testid="openai-message-container"
			className="rounded-dark-card flex cursor-grab"
		>
			<div
				className={`flex flex-col justify-${
					showArrowUp ? 'between' : 'end'
				} items-center pr-2`}
			>
				{showArrowUp && (
					<button
						data-testid="openai-message-arrow-up"
						className="btn btn-ghost p-0 text-accent/70 hover:text-accent ${showArrowUp ?'' : 'hidden'}}"
						onClick={handleArrowUp}
					>
						<ArrowUp height={Dimensions.Five} />
					</button>
				)}
				{showArrowDown && (
					<button
						data-testid="openai-message-arrow-down"
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
							data-testid="openai-message-role-select-label"
						>
							<span className="label-text">
								{t('messageRole')}
							</span>
						</label>
						<select
							className={`select select-bordered select-sm rounded bg-neutral ${roleColor} text-xs`}
							value={role}
							onChange={handleChange(setRole)}
							data-testid="openai-message-role-select"
						>
							{Object.entries(OpenAIPromptMessageRole).map(
								([key, value]) => (
									<option
										key={value}
										id={value}
										value={value}
									>
										{`${key} ${t('message')}`}
									</option>
								),
							)}
						</select>
					</div>
					<div className="form-control" data-no-dnd="true">
						<label
							className="label"
							data-testid="openai-message-name-input-label"
						>
							<span className="label-text flex gap-1">
								{t('messageName')}
								<TooltipIcon
									tooltip={t('messageNameTooltip')}
									dataTestId="openai-message-name-tooltip"
								/>
							</span>
							<span className="label-text-alt">
								{t('optional')}
							</span>
						</label>
						<input
							type="text"
							placeholder={t('messageNameInputPlaceholder')}
							className={`input input-bordered input-sm rounded bg-neutral text-neutral-content text-xs placeholder-neutral-content/50 ${
								!nameIsValid && 'input-error'
							}`}
							data-testid="openai-message-name-input"
							value={name}
							maxLength={64}
							onChange={handleChange(handleSetName)}
						/>
						{!nameIsValid && (
							<span
								className="text-center text-error text-xs"
								data-testid="invalid-name-error-message"
							>
								{t('invalidNameMessage')}
							</span>
						)}
					</div>
				</div>
				<div
					className="form-control grow min-h-full"
					data-no-dnd="true"
				>
					<label
						className="label"
						data-testid="openai-message-content-textarea-label"
					>
						<span className="label-text">
							{t('messageContent')}
						</span>
						<span className="text-accent label-text-alt text-sm">
							{t('wrapVariable')}
						</span>
					</label>
					<textarea
						className="textarea rounded bg-neutral text-neutral-content h-full min-h-fit placeholder-neutral-content/50"
						placeholder={t('messageContentPlaceholder')}
						value={content}
						onChange={handleChange(setContent)}
						data-testid="openai-message-content-textarea"
					/>
				</div>
			</div>
			<button
				className="btn btn-ghost self-center text-neutral-content hover:text-error"
				data-testid="openai-message-delete-button"
				onClick={() => {
					handleDeleteMessage();
				}}
			>
				<XCircle height={Dimensions.Four} width={Dimensions.Four} />
			</button>
		</div>
	);
}

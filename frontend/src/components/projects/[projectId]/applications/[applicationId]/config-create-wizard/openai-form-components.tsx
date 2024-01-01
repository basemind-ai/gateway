import { useTranslations } from 'next-intl';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';

import { ParameterSlider } from '@/components/prompt-display-components/parameter-slider';
import {
	DEFAULT_MAX_TOKENS,
	openAIModelsMaxTokensMap,
	openAIRoleColorMap,
} from '@/constants/models';
import {
	ModelParameters,
	ModelVendor,
	OpenAIContentMessage,
	OpenAIMessageRole,
	OpenAIModelType,
	OpenAIPromptMessageRole,
} from '@/types';
import { handleChange } from '@/utils/events';
import { extractTemplateVariables } from '@/utils/models';

export function OpenAIModelParametersForm({
	modelType,
	setParameters,
	existingParameters,
}: {
	existingParameters?: ModelParameters<ModelVendor.OpenAI>;
	modelType: OpenAIModelType;
	setParameters: (parameters: ModelParameters<ModelVendor.OpenAI>) => void;
}) {
	const t = useTranslations('createConfigWizard');

	const [maxTokens, setMaxTokens] = useState(
		existingParameters?.maxTokens ?? DEFAULT_MAX_TOKENS,
	);
	const [frequencyPenalty, setFrequencyPenalty] = useState(
		existingParameters?.frequencyPenalty ?? 0,
	);
	const [presencePenalty, setPresencePenalty] = useState(
		existingParameters?.presencePenalty ?? 0,
	);
	const [temperature, setTemperature] = useState(
		existingParameters?.temperature ?? 0,
	);
	const [topP, setTopP] = useState(existingParameters?.topP ?? 0);

	const inputs: {
		key: string;
		labelText: string;
		max: number;
		min: number;
		setter: Dispatch<SetStateAction<number>>;
		step: number;
		toolTipText: string;
		value: number;
	}[] = [
		{
			key: 'maxTokens',
			labelText: t('openaiParametersMaxTokensLabel'),
			max: openAIModelsMaxTokensMap[modelType],
			min: 1,
			setter: setMaxTokens,
			step: 1,
			toolTipText: t('openaiParametersMaxTokensTooltip'),
			value: maxTokens,
		},
		{
			key: 'temperature',
			labelText: t('openaiParametersTemperatureLabel'),
			max: 2,
			min: 0,
			setter: setTemperature,
			step: 0.1,
			toolTipText: t('openaiParametersTemperatureTooltip'),
			value: temperature,
		},
		{
			key: 'topP',
			labelText: t('openaiParametersTopPLabel'),
			max: 1,
			min: 0,
			setter: setTopP,
			step: 0.1,
			toolTipText: t('openaiParametersTopPTooltip'),
			value: topP,
		},
		{
			key: 'frequencyPenalty',
			labelText: t('openaiParametersFrequencyPenaltyLabel'),
			max: 2,
			min: 0,
			setter: setFrequencyPenalty,
			step: 0.1,
			toolTipText: t('openaiParametersFrequencyPenaltyTooltip'),
			value: frequencyPenalty,
		},
		{
			key: 'presencePenalty',
			labelText: t('openaiParametersPresencePenaltyLabel'),
			max: 2,
			min: 0,
			setter: setPresencePenalty,
			step: 0.1,
			toolTipText: t('openaiParametersPresencePenaltyTooltip'),
			value: presencePenalty,
		},
	];

	useEffect(() => {
		setParameters({
			frequencyPenalty,
			maxTokens,
			presencePenalty,
			temperature,
			topP,
		});
	}, [maxTokens, frequencyPenalty, presencePenalty, temperature, topP]);

	return (
		<div data-testid="openai-model-parameters-form">
			<h2 className="card-header">{t('modelParameters')}</h2>
			<div className="rounded-dark-card  columns-1 md:grid md:grid-cols-2 lg:grid lg:grid-cols-3 gap-8	gap-y-8">
				{inputs.map(ParameterSlider)}
			</div>
		</div>
	);
}

export const OPEN_AI_DRAFT_MESSAGE = {
	content: '',
	name: '',
	role: OpenAIPromptMessageRole.System,
} satisfies OpenAIContentMessage;

export function OpenAIMessageItem({
	name,
	role,
	dataTestId,
	className,
	handleClick,
}: {
	className: string;
	dataTestId: string;
	handleClick: () => void;
	name?: string;
	role?: OpenAIMessageRole;
}) {
	const t = useTranslations('createConfigWizard');

	return (
		<button
			className={`btn btn-sm border-neutral rounded-full ${className}`}
			data-testid={dataTestId}
			onClick={() => {
				handleClick();
			}}
		>
			<span className="capitalize">
				{/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing */}
				{name || `${role} ${t('message')}`}
			</span>
		</button>
	);
}

export function OpenAIPromptTemplate({
	messages,
	setMessages,
}: {
	messages: OpenAIContentMessage[];
	setMessages: (messages: OpenAIContentMessage[]) => void;
}) {
	const t = useTranslations('createConfigWizard');

	const [activeMessageIndex, setActiveMessageIndex] = useState(
		messages.length,
	);
	const [draftMessage, setDraftMessage] = useState<OpenAIContentMessage>(
		structuredClone(OPEN_AI_DRAFT_MESSAGE),
	);

	const handleRoleChange = (role: OpenAIPromptMessageRole) => {
		setDraftMessage({ ...draftMessage, role });
	};

	const handleNameChange = (value: string) => {
		setDraftMessage({ ...draftMessage, name: value });
	};

	const handleMessageChange = (value: string) => {
		setDraftMessage({ ...draftMessage, content: value });
	};

	const handleDeleteMessage = () => {
		const copiedMessages = [...messages];

		copiedMessages.splice(activeMessageIndex, 1);

		setMessages(copiedMessages);
		setActiveMessageIndex(
			activeMessageIndex - 1 >= 0 ? activeMessageIndex - 1 : 0,
		);
	};

	const handleSaveMessage = () => {
		const copiedMessages = [...messages];
		draftMessage.templateVariables = extractTemplateVariables(
			draftMessage.content,
		);
		copiedMessages[activeMessageIndex] = draftMessage;

		setMessages(copiedMessages);
		setDraftMessage(structuredClone(OPEN_AI_DRAFT_MESSAGE));
		setActiveMessageIndex(copiedMessages.length);
	};

	return (
		<div data-testid="openai-prompt-template-form">
			<h2 className="card-header">{t('promptMessages')}</h2>
			<div className="rounded-dark-card flex flex-col gap-4">
				<div className=" p-4 flex items-start content-start gap-4 self-stretch flex-wrap pt-4 pb-4">
					{messages.map((message, index) => (
						<OpenAIMessageItem
							key={
								/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing */
								message.name || `${message.role}${index}`
							}
							role={message.role}
							name={message.name}
							className={
								activeMessageIndex === index
									? 'btn-secondary'
									: `btn-secondary btn-outline ${
											openAIRoleColorMap[message.role]
										} hover:text-secondary-content`
							}
							dataTestId={`parameters-and-prompt-form-message-${index}`}
							handleClick={() => {
								setActiveMessageIndex(index);
								setDraftMessage(message);
							}}
						/>
					))}
					<OpenAIMessageItem
						name={t('newMessage')}
						dataTestId="parameters-and-prompt-form-new-message"
						handleClick={() => {
							setActiveMessageIndex(messages.length);
							setDraftMessage({
								content: '',
								name: '',
								role: OpenAIPromptMessageRole.System,
							});
						}}
						className={
							activeMessageIndex === messages.length
								? 'btn-secondary'
								: 'btn-secondary text-neutral-content btn-outline hover:text-secondary-content'
						}
					/>
				</div>
				<div className="flex justify-between items-center">
					<div className="w-full flex justify-start gap-10">
						<div className="form-control">
							<label
								className="label"
								data-testid="parameters-and-prompt-form-new-message-role-label"
							>
								<span className="label-text">
									{t('messageRole')}
								</span>
							</label>
							<select
								className="card-select"
								value={draftMessage.role}
								onChange={handleChange(handleRoleChange)}
								data-testid="parameters-and-prompt-form-message-role-select"
							>
								{Object.entries(OpenAIPromptMessageRole).map(
									([key, value]) => (
										<option
											key={value}
											id={value}
											value={value}
										>
											{key.toUpperCase()}
										</option>
									),
								)}
							</select>
						</div>
						<div className="form-control">
							<label
								className="label"
								data-testid="parameters-and-prompt-form-new-message-name-label"
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
								className="card-input"
								data-testid="parameters-and-prompt-form-message-name-input"
								value={draftMessage.name}
								onChange={handleChange(handleNameChange)}
							/>
						</div>
					</div>
				</div>
				<div className="form-control">
					<label
						className="label"
						data-testid="parameters-and-prompt-form-new-message-content-label"
					>
						<span className="label-text">
							{t('messageContent')}
						</span>
						<span
							className="text-info label-text-alt text-sm"
							data-testid="parameters-and-prompt-form-wrap-variable-label"
						>
							{t('wrapVariable')}
						</span>
					</label>
					<textarea
						className="card-textarea"
						placeholder={t('promptMessagePlaceholder')}
						value={draftMessage.content}
						onChange={handleChange(handleMessageChange)}
						data-testid="parameters-and-prompt-form-message-textarea"
					/>
				</div>
				<div className="join justify-end">
					<button
						className="btn join-item btn-sm btn-neutral"
						onClick={handleDeleteMessage}
						data-testid="parameters-and-prompt-form-delete-message-button"
						disabled={!messages.length}
					>
						{t('deleteMessage')}
					</button>
					<button
						className="btn join-item btn-sm btn-primary"
						onClick={handleSaveMessage}
						data-testid="parameters-and-prompt-form-save-message-button"
						disabled={!draftMessage.content}
					>
						{t('saveMessage')}
					</button>
				</div>
			</div>
		</div>
	);
}

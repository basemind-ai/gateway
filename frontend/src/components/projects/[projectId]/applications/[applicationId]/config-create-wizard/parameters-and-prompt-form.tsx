import { useTranslations } from 'next-intl';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { InfoCircle } from 'react-bootstrap-icons';

import {
	DEFAULT_MAX_TOKENS,
	openAIModelsMaxTokensMap,
} from '@/constants/models';
import {
	ModelParameters,
	ModelType,
	ModelVendor,
	OpenAIContentMessage,
	OpenAIModelParameters,
	OpenAIModelType,
	OpenAIPromptMessageRole,
	ProviderMessageType,
} from '@/types';
import { handleChange } from '@/utils/events';
import { formatNumber } from '@/utils/format';
import { extractTemplateVariables } from '@/utils/models';

export function PromptConfigParametersAndPromptForm<T extends ModelVendor>({
	modelVendor,
	modelType,
	messages,
	existingParameters,
	setParameters,
	setMessages,
}: {
	existingParameters?: ModelParameters<T>;
	messages?: ProviderMessageType<T>[];
	modelType: ModelType<T>;
	modelVendor: T;
	setMessages: (messages: ProviderMessageType<T>[]) => void;
	setParameters: (parameters: ModelParameters<T>) => void;
}) {
	return (
		<div
			className="flex flex-col"
			data-testid="parameters-and-prompt-form-container"
		>
			<div>
				{modelVendor === ModelVendor.OpenAI && (
					<OpenAIModelParametersForm
						modelType={modelType as OpenAIModelType}
						setParameters={setParameters}
						existingParameters={
							existingParameters as OpenAIModelParameters
						}
					/>
				)}
			</div>
			<div className="divider divide-accent" />
			<div>
				{modelVendor === ModelVendor.OpenAI && (
					<OpenAIPromptTemplate
						messages={(messages ?? []) as OpenAIContentMessage[]}
						setMessages={
							setMessages as (
								messages: OpenAIContentMessage[],
							) => void
						}
					/>
				)}
			</div>
		</div>
	);
}

export function OpenAIModelParametersForm({
	modelType,
	setParameters,
	existingParameters,
}: {
	existingParameters?: ModelParameters<ModelVendor.OpenAI>;
	modelType: OpenAIModelType;
	setParameters: (parameters: ModelParameters<any>) => void;
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
			key: 'frequencyPenalty',
			labelText: t('openaiParametersFrequencyPenaltyLabel'),
			max: 1,
			min: 0,
			setter: setFrequencyPenalty,
			step: 0.1,
			toolTipText: t('openaiParametersFrequencyPenaltyTooltip'),
			value: frequencyPenalty,
		},
		{
			key: 'presencePenalty',
			labelText: t('openaiParametersPresencePenaltyLabel'),
			max: 1,
			min: 0,
			setter: setPresencePenalty,
			step: 0.1,
			toolTipText: t('openaiParametersPresencePenaltyTooltip'),
			value: presencePenalty,
		},
		{
			key: 'temperature',
			labelText: t('openaiParametersTemperatureLabel'),
			max: 1,
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
			<h2 className="pb-4">{t('modelParameters')}</h2>
			<div className="flex flex-wrap gap-10">
				{inputs.map(
					({
						key,
						toolTipText,
						labelText,
						min,
						max,
						step,
						value,
						setter,
					}) => (
						<div className="form-control min-w-[15rem]" key={key}>
							<label className="label">
								<div
									className="tooltip flex items-center gap-1"
									data-tip={toolTipText}
									data-testid={`${key}-tooltip`}
								>
									<span className="label-text">
										{labelText}
									</span>
									<InfoCircle className="w-3 h-3" />
								</div>
								<span className="label-text-alt">
									{formatNumber(value)}
								</span>
							</label>
							<input
								type="range"
								min={min}
								max={max}
								step={step}
								value={value}
								onChange={handleChange((value: string) => {
									setter(Number.parseFloat(value));
								})}
								className="range range-xs"
								data-testid={`create-prompt-config-dialog-model-parameter-range-${key}`}
							/>
						</div>
					),
				)}
			</div>
		</div>
	);
}

const OPEN_AI_DRAFT_MESSAGE = {
	content: '',
	role: OpenAIPromptMessageRole.System,
} satisfies OpenAIContentMessage;

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

	const handleMessageClick =
		(index: number, message: OpenAIContentMessage) => () => {
			setActiveMessageIndex(index);
			setDraftMessage(message);
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
		<div
			className="flex flex-col gap-4"
			data-testid="openai-prompt-template-form"
		>
			<div className="flex items-start content-start gap-4 self-stretch flex-wrap pt-4 pb-4">
				{messages.map((message, index) => (
					<label
						key={message.name ?? message.role + index}
						className={`rounded-4xl border border-0.5  py-2.5 px-4  ${
							activeMessageIndex === index
								? 'text-secondary border-secondary'
								: 'border-neutral text-base-content'
						}`}
					>
						<input
							type="radio"
							name="promptMessage"
							value={index}
							checked={activeMessageIndex === index}
							onChange={handleMessageClick(index, message)}
							className="hidden"
							data-testid={`parameters-and-prompt-form-message-${index}`}
						/>
						{message.name ?? `${message.role} message`}
					</label>
				))}
				<label
					key={messages.length}
					className={`rounded-4xl border border-0.5  py-2.5 px-4  ${
						activeMessageIndex === messages.length
							? 'text-secondary border-secondary'
							: 'border-neutral text-base-content'
					}`}
				>
					<input
						type="radio"
						name="promptMessage"
						value={messages.length}
						checked={activeMessageIndex === messages.length}
						onChange={handleMessageClick(messages.length, {
							content: '',
							role: OpenAIPromptMessageRole.System,
						})}
						data-testid="parameters-and-prompt-form-new-message"
						className="hidden"
					/>
					{t('newMessage')}
				</label>
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
							className="select select-bordered"
							value={draftMessage.role}
							onChange={handleChange(handleRoleChange)}
							defaultValue={OpenAIPromptMessageRole.System}
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
							className="input"
							data-testid="parameters-and-prompt-form-message-name-input"
							value={draftMessage.name}
							onChange={handleChange(handleNameChange)}
						/>
					</div>
				</div>
				<span
					className="text-info text-sm self-end"
					data-testid="parameters-and-prompt-form-wrap-variable-label"
				>
					{t('wrapVariable')}
				</span>
			</div>
			<div className="form-control">
				<label
					className="label"
					data-testid="parameters-and-prompt-form-new-message-content-label"
				>
					<span className="label-text">{t('messageContent')}</span>
				</label>
				<textarea
					className="textarea textarea-bordered"
					placeholder={t('promptMessagePlaceholder')}
					value={draftMessage.content}
					onChange={handleChange(handleMessageChange)}
					data-testid="parameters-and-prompt-form-message-textarea"
				/>
			</div>
			<div className="flex justify-end gap-4">
				<button
					className="btn btn-outline btn-sm btn-error"
					onClick={handleDeleteMessage}
					data-testid="parameters-and-prompt-form-delete-message-button"
					disabled={!messages.length}
				>
					{t('deleteMessage')}
				</button>
				<button
					className="btn btn-sm btn-primary"
					onClick={handleSaveMessage}
					data-testid="parameters-and-prompt-form-save-message-button"
					disabled={!draftMessage.content}
				>
					{t('saveMessage')}
				</button>
			</div>
		</div>
	);
}

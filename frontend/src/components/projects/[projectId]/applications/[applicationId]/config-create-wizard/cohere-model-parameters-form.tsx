import { useTranslations } from 'next-intl';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';

import { ParameterSlider } from '@/components/prompt-display-components/parameter-slider';
import { DEFAULT_MAX_TOKENS } from '@/constants/models';
import {
	CohereModelType,
	CoherePromptMessage,
	ModelParameters,
	ModelVendor,
	ProviderMessageType,
} from '@/types';
import { handleChange } from '@/utils/events';
import { extractTemplateVariables } from '@/utils/models';

const COHERE_MAX_TOKENS = 4096;

export function CohereModelParametersForm({
	setParameters,
	existingParameters,
}: {
	existingParameters?: ModelParameters<ModelVendor.Cohere>;
	modelType: CohereModelType;
	setParameters: (parameters: ModelParameters<ModelVendor.Cohere>) => void;
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
	const [p, setP] = useState(existingParameters?.p ?? 0);
	const [k, setK] = useState(existingParameters?.k ?? 0);

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
			labelText: t('cohereParametersMaxTokensLabel'),
			max: COHERE_MAX_TOKENS, // cohere has a static max value for now
			min: 1,
			setter: setMaxTokens,
			step: 1,
			toolTipText: t('cohereParametersMaxTokensTooltip'),
			value: maxTokens,
		},
		{
			key: 'temperature',
			labelText: t('cohereParametersTemperatureLabel'),
			max: 5,
			min: 0,
			setter: setTemperature,
			step: 0.1,
			toolTipText: t('cohereParametersTemperatureTooltip'),
			value: temperature,
		},
		{
			key: 'p',
			labelText: t('cohereParametersPLabel'),
			max: 0.99,
			min: 0,
			setter: setP,
			step: 0.01,
			toolTipText: t('cohereParametersPTooltip'),
			value: p,
		},
		{
			key: 'k',
			labelText: t('cohereParametersKLabel'),
			max: 500,
			min: 0,
			setter: setK,
			step: 1,
			toolTipText: t('cohereParametersKTooltip'),
			value: k,
		},
		{
			key: 'frequencyPenalty',
			labelText: t('cohereParametersFrequencyPenaltyLabel'),
			max: 9999,
			min: 0,
			setter: setFrequencyPenalty,
			step: 1,
			toolTipText: t('cohereParametersFrequencyPenaltyTooltip'),
			value: frequencyPenalty,
		},
		{
			key: 'presencePenalty',
			labelText: t('cohereParametersPresencePenaltyLabel'),
			max: 1,
			min: 0,
			setter: setPresencePenalty,
			step: 0.1,
			toolTipText: t('cohereParametersPresencePenaltyTooltip'),
			value: presencePenalty,
		},
	];

	useEffect(() => {
		setParameters({
			frequencyPenalty,
			k,
			maxTokens,
			p,
			presencePenalty,
			temperature,
		});
	}, [maxTokens, frequencyPenalty, presencePenalty, temperature, p, k]);

	return (
		<div data-testid="cohere-model-parameters-form">
			<h2 className="card-header">{t('modelParameters')}</h2>
			<div className="rounded-dark-card columns-1 md:grid md:grid-cols-2 lg:grid lg:grid-cols-3 gap-8	gap-y-8">
				{inputs.map(ParameterSlider)}
			</div>
		</div>
	);
}

export function CoherePromptTemplate({
	messages,
	setMessages,
}: {
	messages: ProviderMessageType<ModelVendor.Cohere>[];
	setMessages: (messages: ProviderMessageType<ModelVendor.Cohere>[]) => void;
}) {
	const t = useTranslations('createConfigWizard');

	const handleSetMessages = (message: string) => {
		setMessages([
			{
				message,
				templateVariables: extractTemplateVariables(message),
			} satisfies CoherePromptMessage,
		]);
	};

	return (
		<div data-testid="cohere-prompt-template-form">
			<h2 className="card-header">{t('promptTemplate')}</h2>
			<div className="form-control">
				<label
					className="label"
					data-testid="parameters-and-prompt-form-new-message-content-label"
				>
					<span className="label-text">{t('messageContent')}</span>
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
					value={messages[0]?.message ?? ''}
					onChange={handleChange(handleSetMessages)}
					data-testid="parameters-and-prompt-form-message-textarea"
				/>
			</div>
		</div>
	);
}

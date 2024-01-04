import { useTranslations } from 'next-intl';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';

import { ParameterSlider } from '@/components/prompt-display-components/parameter-slider';
import {
	DEFAULT_MAX_TOKENS,
	openAIModelsMaxTokensMap,
} from '@/constants/models';
import { ModelParameters, ModelVendor, OpenAIModelType } from '@/types';

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
			<div className="rounded-dark-card  columns-1 md:grid md:grid-cols-2 lg:grid lg:grid-cols-3 gap-8	gap-y-8">
				{inputs.map(ParameterSlider)}
			</div>
		</div>
	);
}

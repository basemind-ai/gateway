import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Dispatch, SetStateAction } from 'react';
import { InfoCircle } from 'react-bootstrap-icons';

import { models, ToolTipText } from '@/constants/models';
import {
	ModelType,
	ModelVendor,
	OpenAIModelParameters,
	PromptConfigTest,
	unavailableModelVendors,
} from '@/types';
import { formatNumber, handleChange } from '@/utils/helpers';

export default function ModelConfiguration<
	ParametersType extends Record<string, any>,
	MessageType extends Record<string, any>,
>({
	config,
	setConfig,
}: {
	config: PromptConfigTest<ParametersType, MessageType>;
	setConfig: Dispatch<
		SetStateAction<PromptConfigTest<ParametersType, MessageType>>
	>;
}) {
	const t = useTranslations('promptTesting');
	function handleSliderChange(
		parameterKey:
			| 'frequencyPenalty'
			| 'maxTokens'
			| 'presencePenalty'
			| 'temperature'
			| 'topP',
	) {
		return (e: { target: { value: any } }) => {
			setConfig((prev) => ({
				...prev,
				modelParameters: {
					...prev.modelParameters,
					[parameterKey]: Number.parseFloat(e.target.value),
				},
			}));
		};
	}
	const renderVendorSelect = () => {
		const selectVendor = (value: ModelVendor) => {
			setConfig((prev) => ({ ...prev, modelVendor: value }));
		};
		return (
			<div>
				<label className="label">
					<span className="label-text text-xs">{t('provider')}</span>
				</label>
				<select
					className="select select-xs bg-base-300 w-fit"
					value={config.modelVendor}
					onChange={handleChange(selectVendor)}
					data-testid="model-vendor-select"
				>
					{Object.entries(ModelVendor).map(([key, value]) => {
						return (
							<option className="text-xs" value={value}>
								{key}
							</option>
						);
					})}
					{Object.entries(unavailableModelVendors).map(
						([key, value]) => (
							<option disabled key={value} value={value}>
								{key}
							</option>
						),
					)}
				</select>
			</div>
		);
	};

	const renderModelTypeSelect = () => {
		const openAIModels = Object.values(ModelType);
		return (
			<div className="form-control">
				<label className="label">
					<span className="label-text text-xs">{t('model')}</span>
				</label>
				{openAIModels.map((model) => (
					<div className="flex gap-2 items-center pb-2" key={model}>
						<input
							id={`radio-model-${model}`}
							type="radio"
							name="radio-model"
							className="radio radio-xs"
							data-testid={`model-type-select-${model}`}
							value={model}
							onChange={(e) => {
								setConfig((prev) => ({
									...prev,
									modelType: e.target.value as ModelType,
								}));
							}}
							checked={config.modelType === model}
						/>
						<label
							htmlFor={`radio-model-${model}`}
							className="flex cursor-pointer gap-2"
						>
							<Image
								priority
								width="12"
								height="12"
								src={`/images/${
									models[config.modelVendor][model].icon
								}`}
								alt="Logo"
							/>
							<span className="label-text">
								{models[config.modelVendor][model].name}
							</span>
						</label>
					</div>
				))}
			</div>
		);
	};

	const renderParameterSliders = () => {
		const modelParametersConfig =
			models[config.modelVendor][config.modelType].parameters;

		return Object.entries(modelParametersConfig).map(
			([key, { min, max, step }]) => {
				// Cast key to keyof OpenAIModelParameters to ensure type safety
				const parameterKey = key as keyof OpenAIModelParameters;

				return (
					<div key={key}>
						<label className="label ">
							<div
								className="tooltip flex items-center gap-1 pr-2"
								data-tip={`${ToolTipText[parameterKey]}`}
							>
								<span className="label-text text-xs">
									{t(key)}
								</span>
								<InfoCircle className="w-2 h-2" />
							</div>
							<span className="label-text-alt text-xs">
								{formatNumber(
									config.modelParameters[parameterKey],
								)}
							</span>
						</label>
						<input
							type="range"
							min={min}
							max={max}
							step={step}
							value={config.modelParameters[parameterKey]}
							onChange={handleSliderChange(parameterKey)}
							className="range range-xs"
							data-testid={`${key}-slider`}
						/>
					</div>
				);
			},
		);
	};

	return (
		<div
			className="custom-card-px-16 flex gap-16"
			data-testid="model-config-card"
		>
			<div className="flex flex-col gap-4">
				{renderVendorSelect()}
				{renderModelTypeSelect()}
			</div>
			<div className="flex-grow flex justify-start gap-x-12 gap-y-8 flex-1 flex-wrap">
				{renderParameterSliders()}
			</div>
		</div>
	);
}

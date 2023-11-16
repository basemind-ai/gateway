/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useCallback } from 'react';
import { InfoCircle } from 'react-bootstrap-icons';

import { cohereModels, openAIModels, ToolTipText } from '@/constants/models';
import {
	CohereModelParameters,
	CohereModelType,
	ModelConfig,
	ModelVendor,
	OpenAIModelParameters,
	OpenAIModelType,
	PromptConfigTest,
	UnavailableModelVendor,
} from '@/types';
import { formatNumber, handleChange } from '@/utils/helpers';

export default function ModelConfigurationView({
	promptTestConfig,
	setPromptTestConfig,
}: {
	promptTestConfig: PromptConfigTest<any>;
	setPromptTestConfig: (promptTestConfig: PromptConfigTest<any>) => void;
}) {
	const selectModelVendor = useCallback(
		(modelVendor: ModelVendor) => {
			setPromptTestConfig({ ...promptTestConfig, modelVendor });
		},
		[promptTestConfig, setPromptTestConfig],
	);

	const selectModelType = useCallback(
		(modelType: OpenAIModelType) => {
			setPromptTestConfig({ ...promptTestConfig, modelType });
		},
		[promptTestConfig, setPromptTestConfig],
	);

	const setModelParameters = useCallback(
		(modelParameters: OpenAIModelParameters | CohereModelParameters) => {
			setPromptTestConfig({ ...promptTestConfig, modelParameters });
		},
		[promptTestConfig, setPromptTestConfig],
	);

	const ModelSelect = modelSelectFactory<any>(
		promptTestConfig.modelVendor === ModelVendor.OpenAI
			? OpenAIModelType
			: CohereModelType,
	);

	const ParameterConfig = modelParametersFactory<any, any>(
		promptTestConfig.modelVendor === ModelVendor.OpenAI
			? OpenAIModelType
			: CohereModelType,
	);

	return (
		<div
			className="custom-card-px-16 flex gap-16"
			data-testid="model-config-card"
		>
			<div className="flex flex-col gap-4">
				<ModelVendorSelect
					selectedModelVendor={promptTestConfig.modelVendor}
					setSelectedModelVendor={selectModelVendor}
				/>
				<ModelSelect
					selectedModelType={promptTestConfig.modelType as any}
					setSelectedModelType={selectModelType}
				/>
			</div>
			<div className="flex-grow flex justify-start gap-x-12 gap-y-8 flex-1 flex-wrap">
				<ParameterConfig
					setModelParameters={setModelParameters}
					modelType={promptTestConfig.modelType}
					parameters={promptTestConfig.modelParameters}
				/>
			</div>
		</div>
	);
}

export function ModelVendorSelect({
	selectedModelVendor,
	setSelectedModelVendor,
}: {
	selectedModelVendor: ModelVendor;
	setSelectedModelVendor: (modelVendor: ModelVendor) => void;
}) {
	const t = useTranslations('promptTesting');

	return (
		<div>
			<label className="label">
				<span className="label-text text-xs">{t('provider')}</span>
			</label>
			<select
				className="select select-xs bg-base-300 w-fit"
				value={selectedModelVendor}
				onChange={handleChange(setSelectedModelVendor)}
				data-testid="model-vendor-select"
			>
				{Object.entries(ModelVendor).map(([key, value]) => {
					return (
						<option className="text-xs" value={value}>
							{key}
						</option>
					);
				})}
				{Object.entries(UnavailableModelVendor).map(([key, value]) => (
					<option disabled key={value} value={value}>
						{key}
					</option>
				))}
			</select>
		</div>
	);
}

export function modelSelectFactory<
	T extends typeof OpenAIModelType | typeof CohereModelType,
>(
	modelTypeEnum: T,
): React.FC<{
	selectedModelType: T[keyof T];
	setSelectedModelType: (modelType: T[keyof T]) => void;
}> {
	return ({
		selectedModelType,
		setSelectedModelType,
	}: {
		selectedModelType: T[keyof T];
		setSelectedModelType: (modelType: T[keyof T]) => void;
	}) => {
		const t = useTranslations('promptTesting');

		const values =
			modelTypeEnum === OpenAIModelType
				? Object.values(OpenAIModelType)
				: Object.values(CohereModelType);
		const models =
			modelTypeEnum === OpenAIModelType ? openAIModels : cohereModels;

		return (
			<div className="form-control">
				<label className="label">
					<span className="label-text text-xs">{t('model')}</span>
				</label>
				{values.map((modelType) => (
					<div
						className="flex gap-2 items-center pb-2"
						key={modelType}
					>
						<input
							id={`radio-model-${modelType}`}
							type="radio"
							name="radio-model"
							className="radio radio-xs"
							data-testid={`model-type-select-${modelType}`}
							value={modelType}
							onChange={handleChange(setSelectedModelType)}
							checked={selectedModelType === modelType}
						/>
						<label
							htmlFor={`radio-model-${modelType}`}
							className="flex cursor-pointer gap-2"
						>
							<Image
								priority
								width="12"
								height="12"
								src={`/images/${
									(
										Reflect.get(models, modelType) as {
											icon: string;
										}
									).icon
								}`}
								alt="Logo"
							/>
							<span className="label-text">
								{
									(
										Reflect.get(models, modelType) as {
											name: string;
										}
									).name
								}
							</span>
						</label>
					</div>
				))}
			</div>
		);
	};
}

export function modelParametersFactory<
	T extends typeof OpenAIModelType | typeof CohereModelType,
	P extends OpenAIModelParameters | CohereModelParameters,
>(
	modelTypeEnum: T,
): React.FC<{
	modelType: T[keyof T];
	parameters: P;
	setModelParameters: (parameters: P) => void;
}> {
	return ({
		modelType,
		parameters,
		setModelParameters,
	}: {
		modelType: T[keyof T];
		parameters: P;
		setModelParameters: (parameters: P) => void;
	}) => {
		const t = useTranslations('promptTesting');

		const sliderChangeHandler =
			(key: keyof P) => (e: { target: { value: string } }) => {
				setModelParameters({
					...parameters,
					[key]: Number.parseFloat(e.target.value),
				});
			};

		const models =
			modelTypeEnum === OpenAIModelType ? openAIModels : cohereModels;

		const modelParameters = (
			models[
				modelType as unknown as keyof typeof models
			] as unknown as ModelConfig<P>
		).parameters;

		return Object.entries(modelParameters).map(
			([key, { min, max, step }]) => {
				const parameterKey = key as keyof P;

				return (
					<div key={key}>
						<label className="label ">
							<div
								className="tooltip flex items-center gap-1 pr-2"
								data-tip={`${
									ToolTipText[
										parameterKey as keyof typeof ToolTipText
									]
								}`}
							>
								<span className="label-text text-xs">
									{t(key)}
								</span>
								<InfoCircle className="w-2 h-2" />
							</div>
							<span className="label-text-alt text-xs">
								{formatNumber(
									parameters[parameterKey] as string | number,
								)}
							</span>
						</label>
						<input
							type="range"
							min={min}
							max={max}
							step={step}
							value={parameters[parameterKey] as string | number}
							onChange={sliderChangeHandler(parameterKey)}
							className="range range-xs"
							data-testid={`${key}-slider`}
						/>
					</div>
				);
			},
		);
	};
}

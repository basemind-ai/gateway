import { useTranslations } from 'next-intl';
import { useEffect, useMemo } from 'react';

import { EntityNameInput } from '@/components/entity-name-input';
import {
	modelTypeToLocaleMap,
	modelVendorTypeMap,
	UnavailableModelVendor,
} from '@/constants/models';
import {
	CohereModelType,
	ModelType,
	ModelVendor,
	OpenAIModelType,
} from '@/types';
import { handleChange } from '@/utils/events';

export function PromptConfigBaseForm({
	configName,
	setConfigName,
	modelVendor,
	modelType,
	setVendor,
	setModelType,
	setIsValid,
	validateConfigName,
	showConfigNameInput = true,
}: {
	configName: string;
	modelType: ModelType<any>;
	modelVendor: ModelVendor;
	setConfigName: (configName: string) => void;
	setIsValid: (isValid: boolean) => void;
	setModelType: (modelType: ModelType<any>) => void;
	setVendor: (modelVendor: ModelVendor) => void;
	showConfigNameInput?: boolean;
	validateConfigName: (value: string) => boolean;
}) {
	const t = useTranslations('createConfigWizard');

	const activeModelVendor = useMemo(
		() =>
			Object.entries(ModelVendor)
				.filter(([, value]) =>
					[ModelVendor.OpenAI, ModelVendor.Cohere].includes(value),
				)
				.map(([key, value]) => {
					return (
						<option key={key} value={value}>
							{key}
						</option>
					);
				}),
		[],
	);

	const invalidModelVendors = useMemo(
		() =>
			Object.entries(UnavailableModelVendor).map(([key, value]) => (
				<option disabled key={value} value={value}>
					{key}
				</option>
			)),
		[],
	);

	useEffect(() => {
		if (
			modelVendor === ModelVendor.Cohere &&
			!Object.values(CohereModelType).includes(
				modelType as CohereModelType,
			)
		) {
			setModelType(CohereModelType.Command);
		}
		if (
			modelVendor === ModelVendor.OpenAI &&
			!Object.values(OpenAIModelType).includes(
				modelType as OpenAIModelType,
			)
		) {
			setModelType(OpenAIModelType.Gpt35Turbo);
		}
	}, [modelVendor]);

	return (
		<div data-testid="base-form-container">
			{showConfigNameInput && (
				<>
					<div data-testid="prompt-config-name-input-form-container">
						<h2 className="card-header">{t('configName')}</h2>
						<div className="rounded-dark-card flex flex-col">
							<EntityNameInput
								dataTestId="create-prompt-base-form-name-input"
								placeholder={t(
									'promptConfigNameInputPlaceholder',
								)}
								isLoading={false}
								value={configName}
								setValue={setConfigName}
								setIsValid={setIsValid}
								validateValue={validateConfigName}
							/>
						</div>
					</div>
					<div className="card-section-divider" />
				</>
			)}
			<div data-testid="prompt-config-model-select-form-container">
				<h2 className="card-header">{t('modelSelection')}</h2>
				<div className="rounded-dark-card grid grid-cols-2 items-center gap-4">
					<div className="form-control">
						<label className="label">
							<span className="label-text">
								{t('promptConfigVendorSelectLabel')}
							</span>
						</label>
						<select
							className="card-select w-full"
							value={modelVendor}
							onChange={handleChange(setVendor)}
							data-testid="create-prompt-base-form-vendor-select"
						>
							{activeModelVendor}
							{invalidModelVendors}
						</select>
					</div>
					<div className="form-control">
						<label className="label">
							<span className="label-text">
								{t('promptConfigModelSelectLabel')}
							</span>
						</label>
						<select
							className="card-select w-full"
							value={modelType}
							onChange={handleChange(setModelType)}
							data-testid="create-prompt-base-form-model-select"
						>
							{Object.values(modelVendorTypeMap[modelVendor]).map(
								(modelChoice: string) => {
									return (
										<option
											key={modelChoice}
											value={modelChoice}
										>
											{
												modelTypeToLocaleMap[
													modelChoice as ModelType<any>
												]
											}
										</option>
									);
								},
							)}
						</select>
					</div>
				</div>
			</div>
		</div>
	);
}

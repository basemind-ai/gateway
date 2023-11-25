import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { EntityNameInput } from '@/components/entity-name-input';
import {
	modelTypeToLocaleMap,
	modelVendorTypeMap,
	UnavailableModelVendor,
} from '@/constants/models';
import { ModelType, ModelVendor } from '@/types';
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
}: {
	configName: string;
	modelType: ModelType<any>;
	modelVendor: ModelVendor;
	setConfigName: (configName: string) => void;
	setIsValid: (isValid: boolean) => void;
	setModelType: (modelType: ModelType<any>) => void;
	setVendor: (modelVendor: ModelVendor) => void;
	validateConfigName: (value: string) => boolean;
}) {
	const t = useTranslations('createConfigWizard');

	const modelChoices = useMemo(() => {
		return Object.values(modelVendorTypeMap[modelVendor]) as string[];
	}, [modelVendor]);

	return (
		<div data-testid="base-form-container">
			<div className="flex flex-col">
				<EntityNameInput
					dataTestId="create-prompt-base-form-name-input"
					placeholder={t('promptConfigNameInputPlaceholder')}
					isLoading={false}
					value={configName}
					setValue={setConfigName}
					setIsValid={setIsValid}
					validateValue={validateConfigName}
				/>
				<div className="px-4 form-control">
					<label className="label">
						<span className="label-text">
							{t('promptConfigVendorSelectLabel')}
						</span>
					</label>
					<select
						className="select select-bordered bg-neutral w-full"
						value={modelVendor}
						onChange={handleChange(setVendor)}
						disabled={true}
						data-testid="create-prompt-base-form-vendor-select"
					>
						{Object.entries(ModelVendor)
							.filter(([, value]) => value === ModelVendor.OpenAI)
							.map(([key, value]) => {
								return (
									<option key={key} value={value}>
										{key}
									</option>
								);
							})}
						{Object.entries(UnavailableModelVendor).map(
							([key, value]) => (
								<option disabled key={value} value={value}>
									{key}
								</option>
							),
						)}
					</select>
				</div>
				<div className="p-4 form-control">
					<label className="label">
						<span className="label-text">
							{t('promptConfigModelSelectLabel')}
						</span>
					</label>
					<select
						className="select select-bordered bg-neutral w-full"
						value={modelType}
						onChange={handleChange(setModelType)}
						data-testid="create-prompt-base-form-model-select"
					>
						{modelChoices.map((modelChoice) => {
							return (
								<option key={modelChoice} value={modelChoice}>
									{
										modelTypeToLocaleMap[
											modelChoice as ModelType<any>
										]
									}
								</option>
							);
						})}
					</select>
				</div>
			</div>
		</div>
	);
}

import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { UnavailableModelVendor } from '@/components/prompt-config/model-configuration-view';
import { modelTypeToNameMap } from '@/constants/models';
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
}: {
	configName: string;
	modelType: ModelType<any>;
	modelVendor: ModelVendor;
	setConfigName: (configName: string) => void;
	setModelType: (modelType: ModelType<any>) => void;
	setVendor: (modelVendor: ModelVendor) => void;
}) {
	const t = useTranslations('createPromptConfigDialog');

	const modelChoices = useMemo(() => {
		const providerEnum =
			modelVendor === ModelVendor.OpenAI
				? OpenAIModelType
				: CohereModelType;
		return Object.values(providerEnum) as string[];
	}, [modelVendor]);

	return (
		<>
			<div className="flex flex-col">
				<div className="px-4 form-control">
					<label className="label">
						<span className="label-text">
							{t('promptConfigNameInputLabel')}
						</span>
						<span className="label-text-alt">
							{t('promptConfigNameInputLabelAlt')}
						</span>
					</label>
					<input
						data-testid="create-prompt-config-dialog-name-input"
						type="text"
						placeholder={t('promptConfigNameInputPlaceholder')}
						className="input input-bordered bg-neutral w-full"
						value={configName}
						onChange={handleChange(setConfigName)}
					/>
				</div>
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
						defaultValue={ModelVendor.OpenAI}
						disabled={true}
						data-testid="create-prompt-config-dialog-vendor-select"
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
						defaultValue={OpenAIModelType.Gpt35Turbo}
						data-testid="create-prompt-config-dialog-model-select"
					>
						{modelChoices.map((modelChoice) => {
							return (
								<option key={modelChoice} value={modelChoice}>
									{
										modelTypeToNameMap[
											modelChoice as ModelType<any>
										]
									}
								</option>
							);
						})}
					</select>
				</div>
			</div>
		</>
	);
}

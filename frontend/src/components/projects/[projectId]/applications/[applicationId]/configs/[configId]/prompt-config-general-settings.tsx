import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';

import { handleUpdatePromptConfig } from '@/api';
import { EntityNameInput } from '@/components/entity-name-input';
import { useHandleError } from '@/hooks/use-handle-error';
import { usePromptConfigs, useUpdatePromptConfig } from '@/stores/api-store';
import { ModelVendor, PromptConfig } from '@/types';

export function PromptConfigGeneralSettings<T extends ModelVendor>({
	projectId,
	applicationId,
	promptConfig,
}: {
	applicationId: string;
	projectId: string;
	promptConfig: PromptConfig<T>;
}) {
	const t = useTranslations('promptConfig');

	const handleError = useHandleError();
	const updatePromptConfig = useUpdatePromptConfig();
	const promptConfigs = usePromptConfigs();

	const [name, setName] = useState(promptConfig.name);
	const [isLoading, setIsLoading] = useState(false);
	const [isNameValid, setIsNameValid] = useState(false);
	const [isNameChanged, setIsNameChanged] = useState(false);

	const validateConfigName = useCallback(
		(value: string) =>
			!(
				promptConfigs[applicationId]
					?.filter((c) => c.id !== promptConfig.id)
					.map((c) => c.name) ?? []
			).includes(value),
		[promptConfigs, promptConfig],
	);

	async function saveSettings() {
		try {
			setIsLoading(true);
			const updatedPromptConfig = await handleUpdatePromptConfig({
				applicationId,
				data: {
					name: name.trim(),
				},
				projectId,
				promptConfigId: promptConfig.id,
			});
			updatePromptConfig(applicationId, updatedPromptConfig);
		} catch (e) {
			handleError(e);
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<div data-testid="prompt-general-settings-container">
			<h2 className="card-header">{t('general')}</h2>
			<div className="rounded-data-card">
				<EntityNameInput
					dataTestId="prompt-general-settings-name-input"
					validateValue={validateConfigName}
					value={name}
					setValue={setName}
					isLoading={isLoading}
					setIsValid={setIsNameValid}
					setIsChanged={setIsNameChanged}
				/>
				<div className="flex justify-end pt-6">
					<button
						data-testid="prompt-general-settings-save-button"
						disabled={!isNameChanged || !isNameValid || isLoading}
						className="card-action-button invalid:disabled btn-primary"
						onClick={() => void saveSettings()}
					>
						{isLoading ? (
							<span className="loading loading-spinner loading-sm mx-2" />
						) : (
							t('save')
						)}
					</button>
				</div>
			</div>
		</div>
	);
}

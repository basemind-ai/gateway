import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { handleUpdatePromptConfig } from '@/api';
import { PromptConfigNameInput } from '@/components/config-display-components/prompt-config-name-input';
import { ApiError } from '@/errors';
import { useUpdatePromptConfig } from '@/stores/api-store';
import { useShowError } from '@/stores/toast-store';
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

	const showError = useShowError();
	const updatePromptConfig = useUpdatePromptConfig();

	const [name, setName] = useState(promptConfig.name);
	const [isLoading, setIsLoading] = useState(false);
	const [nameValid, setNameValid] = useState(false);
	const [nameChanged, setNameChanged] = useState(false);

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
			showError((e as ApiError).message);
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<div data-testid="prompt-general-settings-container">
			<h2 className="font-medium text-neutral-content text-xl">
				{t('general')}
			</h2>
			<div className="rounded-data-card">
				<PromptConfigNameInput
					dataTestId="prompt-general-settings-name-input"
					applicationId={applicationId}
					value={name}
					setValue={setName}
					isLoading={isLoading}
					promptConfigId={promptConfig.id}
					setIsValid={setNameValid}
					setIsChanged={setNameChanged}
				/>
				<div className="flex justify-end pt-3">
					<button
						data-testid="prompt-general-settings-save-button"
						disabled={!nameChanged || !nameValid || isLoading}
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

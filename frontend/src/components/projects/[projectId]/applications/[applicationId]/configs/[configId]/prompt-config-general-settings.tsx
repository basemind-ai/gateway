import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { handleUpdatePromptConfig } from '@/api';
import { MIN_NAME_LENGTH } from '@/constants';
import { ApiError } from '@/errors';
import { useApplication, useUpdatePromptConfig } from '@/stores/api-store';
import { useShowError } from '@/stores/toast-store';
import { ModelVendor, PromptConfig } from '@/types';
import { handleChange } from '@/utils/events';

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

	const application = useApplication(projectId, applicationId);
	const showError = useShowError();
	const updatePromptConfig = useUpdatePromptConfig();

	const [name, setName] = useState(promptConfig.name);
	const [isLoading, setIsLoading] = useState(false);

	const isChanged = name !== promptConfig.name;
	const isValid = name.trim().length >= MIN_NAME_LENGTH;

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

	if (!application) {
		return null;
	}

	return (
		<div data-testid="prompt-general-settings-container">
			<h2 className="font-medium text-neutral-content text-xl">
				{t('general')}
			</h2>
			<div className="custom-card flex flex-col">
				<div className="grid grid-cols-2 gap-x-4 gap-y-8 text-neutral-content">
					<div>
						<p className="text-sm block">
							{t('partOfApplication')}
						</p>
						<p className="font-medium mt-2.5">{application.name}</p>
					</div>
					<div>
						<p className="text-sm block">{t('id')}</p>
						<p
							data-testid="prompt-id"
							className="font-medium mt-2.5"
						>
							{promptConfig.id}
						</p>
					</div>

					<div>
						<label
							htmlFor="prompt-name"
							className="text-sm text-neutral-content block"
						>
							{t('name')}
						</label>
						<input
							type="text"
							data-testid="prompt-name-input"
							className="input mt-2.5 bg-neutral min-w-[70%]"
							value={name}
							disabled={isLoading}
							onChange={handleChange(setName)}
						/>
					</div>
				</div>

				<button
					data-testid="prompt-setting-save-btn"
					disabled={!isChanged || !isValid || isLoading}
					className="btn btn-primary ml-auto mt-8 capitalize"
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
	);
}

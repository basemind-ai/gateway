import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { handleUpdatePromptConfig } from '@/api';
import { MIN_NAME_LENGTH } from '@/constants';
import { ApiError } from '@/errors';
import {
	useApplication,
	usePromptConfig,
	useUpdatePromptConfig,
} from '@/stores/project-store';
import { useShowError } from '@/stores/toast-store';
import { OpenAIModelParameters, OpenAIPromptMessage } from '@/types';
import { handleChange } from '@/utils/helpers';

export function PromptGeneralSettings({
	projectId,
	applicationId,
	promptConfigId,
}: {
	projectId: string;
	applicationId: string;
	promptConfigId: string;
}) {
	const t = useTranslations('promptConfig');
	const promptConfig = usePromptConfig<
		OpenAIModelParameters,
		OpenAIPromptMessage
	>(applicationId, promptConfigId);
	const updatePromptConfig = useUpdatePromptConfig();

	const application = useApplication(projectId, applicationId);

	const [name, setName] = useState(promptConfig?.name ?? '');
	const [loading, setLoading] = useState(false);

	const showError = useShowError();

	const isChanged = name !== promptConfig?.name;
	const isValid = name.trim().length >= MIN_NAME_LENGTH;

	async function saveSettings() {
		if (loading) {
			return;
		}

		try {
			setLoading(true);
			const updatedPromptConfig = await handleUpdatePromptConfig({
				projectId,
				applicationId,
				promptConfigId,
				data: {
					name: name.trim(),
				},
			});
			updatePromptConfig(applicationId, updatedPromptConfig);
		} catch (e) {
			showError((e as ApiError).message);
		} finally {
			setLoading(false);
		}
	}

	if (!promptConfig || !application) {
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
							id="prompt-name"
							data-testid="prompt-name-input"
							className="input mt-2.5 bg-neutral min-w-[70%]"
							value={name}
							onChange={handleChange(setName)}
						/>
					</div>
				</div>

				<button
					data-testid="prompt-setting-save-btn"
					disabled={!isChanged || !isValid}
					className="btn btn-primary ml-auto mt-8 capitalize"
					onClick={() => void saveSettings()}
				>
					{loading ? (
						<span className="loading loading-spinner loading-sm mx-2" />
					) : (
						t('save')
					)}
				</button>
			</div>
		</div>
	);
}

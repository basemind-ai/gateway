import { useTranslations } from 'next-intl';
import { useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';

import {
	handleRetrievePromptConfigs,
	handleSetDefaultPromptConfig,
	handleUpdateApplication,
} from '@/api';
import { MIN_NAME_LENGTH } from '@/constants';
import { ApiError } from '@/errors';
import {
	useApplication,
	usePromptConfigs,
	useSetPromptConfigs,
	useUpdateApplication,
} from '@/stores/api-store';
import { useShowError } from '@/stores/toast-store';
import { handleChange } from '@/utils/events';

export function ApplicationGeneralSettings({
	projectId,
	applicationId,
}: {
	applicationId: string;
	projectId: string;
}) {
	const t = useTranslations('application');
	const application = useApplication(projectId, applicationId);
	const updateApplication = useUpdateApplication();

	const showError = useShowError();
	const { mutate } = useSWRConfig();

	const [name, setName] = useState(application?.name);
	const [description, setDescription] = useState(application?.description);
	const [loading, setLoading] = useState(false);

	const [initialPromptConfig, setInitialPromptConfig] = useState<
		string | undefined
	>();
	const [defaultPromptConfig, setDefaultPromptConfig] = useState<
		string | undefined
	>();
	const setPromptConfig = useSetPromptConfigs();
	const promptConfigs = usePromptConfigs();

	const isChanged =
		name !== application?.name ||
		description !== application?.description ||
		initialPromptConfig !== defaultPromptConfig;

	const isValid =
		name &&
		description &&
		name.trim().length >= MIN_NAME_LENGTH &&
		description.trim().length >= MIN_NAME_LENGTH;

	useSWR(
		{
			applicationId,
			projectId,
		},
		handleRetrievePromptConfigs,
		{
			/* c8 ignore start */
			onError({ message }: ApiError) {
				showError(message);
			},
			/* c8 ignore end */
			onSuccess(promptConfigResponse) {
				if (
					Array.isArray(promptConfigResponse) &&
					promptConfigResponse.length
				) {
					setPromptConfig(applicationId, promptConfigResponse);

					const defaultConfig = promptConfigResponse.find(
						(promptConfig) => promptConfig.isDefault,
					)?.id;
					setInitialPromptConfig(defaultConfig);
					setDefaultPromptConfig(defaultConfig);
				}
			},
		},
	);

	async function saveFormSettings() {
		if (
			name === application?.name &&
			description === application?.description
		) {
			return;
		}
		const updatedApplication = await handleUpdateApplication({
			applicationId,
			data: {
				description: description?.trim(),
				name: name?.trim(),
			},
			projectId,
		});
		updateApplication(projectId, applicationId, updatedApplication);
	}

	async function savePromptSettings() {
		if (
			!defaultPromptConfig ||
			initialPromptConfig === defaultPromptConfig
		) {
			return;
		}
		await handleSetDefaultPromptConfig({
			applicationId,
			projectId,
			promptConfigId: defaultPromptConfig,
		});
		await mutate({
			applicationId,
			projectId,
		});
	}

	async function saveSettings() {
		if (loading) {
			return;
		}

		try {
			setLoading(true);
			await Promise.all([saveFormSettings(), savePromptSettings()]);
		} catch (e) {
			showError((e as ApiError).message);
		} finally {
			setLoading(false);
		}
	}

	if (!application) {
		return null;
	}

	return (
		<div data-testid="application-general-settings-container">
			<h2 className="font-semibold text-white text-xl">{t('general')}</h2>
			<div className="custom-card flex flex-col">
				<div>
					<label
						htmlFor="app-name"
						className="font-medium text-xl text-neutral-content block"
					>
						{t('applicationName')}
					</label>
					<input
						type="text"
						id="app-name"
						data-testid="application-name-input"
						className="input mt-2.5 bg-neutral min-w-full"
						value={name}
						onChange={handleChange(setName)}
					/>
				</div>
				<div className="mt-8">
					<label
						htmlFor="app-desc"
						className="font-medium text-xl text-neutral-content block"
					>
						{t('applicationDescription')}
					</label>
					<textarea
						id="app-desc"
						data-testid="application-description-input"
						className="textarea mt-2.5 bg-neutral w-full"
						value={description}
						onChange={handleChange(setDescription)}
					/>
				</div>

				<div className="mt-8 border border-neutral rounded-3xl py-6 px-8 text-neutral-content">
					<h6 className="font-semibold text-lg">
						{t('defaultPromptConfig')}
					</h6>
					<p className="mt-3.5 font-medium text-sm ">
						{t('defaultPromptConfigMessage')}
					</p>
					<select
						data-testid="application-default-prompt"
						className="mt-16 select select-bordered w-full max-w-xs bg-neutral text-base-content font-bold"
						value={defaultPromptConfig}
						onChange={handleChange(setDefaultPromptConfig)}
					>
						{promptConfigs[applicationId]?.map((promptConfig) => (
							<option
								key={promptConfig.id}
								className="text-base-content font-bold"
								value={promptConfig.id}
							>
								{promptConfig.name || promptConfig.id}
							</option>
						))}
					</select>
				</div>

				<button
					data-testid="application-setting-save-btn"
					disabled={!isChanged || !isValid}
					className="btn btn-primary ml-auto mt-8 capitalize"
					onClick={() => void saveSettings()}
				>
					{loading ? (
						<span className="loading loading-spinner loading-xs mx-2" />
					) : (
						t('save')
					)}
				</button>
			</div>
		</div>
	);
}

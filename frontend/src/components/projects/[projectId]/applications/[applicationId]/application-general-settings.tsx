import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';

import {
	handleRetrievePromptConfigs,
	handleSetDefaultPromptConfig,
	handleUpdateApplication,
} from '@/api';
import { EntityNameInput } from '@/components/entity-name-input';
import { useHandleError } from '@/hooks/use-handle-error';
import {
	useApplications,
	usePromptConfigs,
	useSetPromptConfigs,
	useUpdateApplication,
} from '@/stores/api-store';
import { Application } from '@/types';
import { handleChange } from '@/utils/events';

export function ApplicationGeneralSettings({
	projectId,
	application,
}: {
	application: Application;
	projectId: string;
}) {
	const t = useTranslations('application');

	const promptConfigs = usePromptConfigs();
	const setPromptConfig = useSetPromptConfigs();
	const applications = useApplications(projectId);
	const updateApplication = useUpdateApplication();
	const handleError = useHandleError();
	const { mutate } = useSWRConfig();

	const [name, setName] = useState(application.name);
	const [isNameValid, setIsNameValid] = useState(true);
	const [description, setDescription] = useState(
		application.description ?? '',
	);
	const [isLoading, setIsLoading] = useState(false);

	const [initialPromptConfigId, setInitialPromptConfigId] = useState<
		string | undefined
	>();
	const [defaultPromptConfigId, setDefaultPromptConfigId] = useState<
		string | undefined
	>();

	const isChanged =
		name !== application.name ||
		description !== application.description ||
		initialPromptConfigId !== defaultPromptConfigId;

	const validateName = useCallback(
		(value: string) =>
			!applications
				?.filter(Boolean)
				.filter((app) => app.id !== application.id)
				.map((app) => app.name)
				.includes(value),
		[applications, application],
	);

	useSWR(
		{
			applicationId: application.id,
			projectId,
		},
		handleRetrievePromptConfigs,
		{
			onError: handleError,
			onSuccess(promptConfigResponse) {
				if (
					Array.isArray(promptConfigResponse) &&
					promptConfigResponse.length
				) {
					setPromptConfig(application.id, promptConfigResponse);

					const defaultConfig = promptConfigResponse.find(
						(promptConfig) => promptConfig.isDefault,
					);

					setInitialPromptConfigId(defaultConfig?.id);
					setDefaultPromptConfigId(defaultConfig?.id);
				}
			},
		},
	);

	async function saveFormSettings() {
		const updatedApplication = await handleUpdateApplication({
			applicationId: application.id,
			data: {
				description: description.trim(),
				name: name.trim(),
			},
			projectId,
		});
		updateApplication(projectId, application.id, updatedApplication);
	}

	async function savePromptSettings() {
		await handleSetDefaultPromptConfig({
			applicationId: application.id,
			projectId,
			promptConfigId: defaultPromptConfigId!,
		});
		await mutate({
			applicationId: application.id,
			projectId,
		});
	}

	async function saveSettings() {
		try {
			setIsLoading(true);

			const operations: Promise<void>[] = [];

			if (isChanged) {
				operations.push(saveFormSettings());
			}

			if (
				defaultPromptConfigId &&
				initialPromptConfigId !== defaultPromptConfigId
			) {
				operations.push(savePromptSettings());
			}

			await Promise.all(operations);
		} catch (e) {
			handleError(e);
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<div data-testid="application-general-settings-container">
			<h2 className="card-header">{t('general')}</h2>
			<div className="rounded-data-card flex flex-col">
				<EntityNameInput
					dataTestId={'application-name-input'}
					isLoading={isLoading}
					setIsValid={setIsNameValid}
					setValue={setName}
					validateValue={validateName}
					value={name}
				/>

				<div className="form-control mt-8">
					<label className="label">
						<span className="label-text">
							{t('applicationDescription')}
						</span>
					</label>
					<textarea
						data-testid="application-description-input"
						className="card-textarea"
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
						value={defaultPromptConfigId}
						onChange={handleChange(setDefaultPromptConfigId)}
						disabled={
							(promptConfigs[application.id]?.length ?? 0) < 2
						}
					>
						{promptConfigs[application.id]?.map((promptConfig) => (
							<option
								key={promptConfig.id}
								className="text-base-content font-bold"
								value={promptConfig.id}
							>
								{promptConfig.name}
							</option>
						))}
					</select>
				</div>

				<button
					data-testid="application-setting-save-btn"
					disabled={isLoading || !isNameValid || !isChanged}
					className="btn btn-primary ml-auto mt-8 capitalize"
					onClick={() => void saveSettings()}
				>
					{isLoading ? (
						<span className="loading loading-spinner loading-xs mx-2" />
					) : (
						t('save')
					)}
				</button>
			</div>
		</div>
	);
}

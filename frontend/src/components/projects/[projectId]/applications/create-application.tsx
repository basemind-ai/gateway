import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { handleCreateAPIKey, handleCreateApplication } from '@/api';
import { CreateApiKey } from '@/components/projects/[projectId]/applications/[applicationId]/create-api-key';
import { MIN_NAME_LENGTH, Navigation } from '@/constants';
import { ApiError } from '@/errors';
import { useAddApplication } from '@/stores/api-store';
import { useShowError, useShowInfo } from '@/stores/toast-store';
import { handleChange } from '@/utils/events';
import { setApplicationId, setProjectId } from '@/utils/navigation';

export function CreateApplication({
	onClose,
	projectId,
}: {
	onClose: () => void;
	projectId: string;
}) {
	const t = useTranslations('createApplication');
	const router = useRouter();
	const addApplication = useAddApplication();

	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [apiKeyName, setAPIKeyName] = useState('');
	const [loading, setLoading] = useState(false);

	const [apiKey, setAPIKey] = useState<string | null>(null);
	const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

	const showError = useShowError();
	const showInfo = useShowInfo();

	const isValid =
		name.trim().length >= MIN_NAME_LENGTH &&
		(description.trim().length >= MIN_NAME_LENGTH ||
			description.trim().length === 0) &&
		(apiKeyName.trim().length >= MIN_NAME_LENGTH ||
			apiKeyName.trim().length === 0);

	async function createApplication() {
		try {
			setLoading(true);

			const application = await handleCreateApplication({
				data: {
					description: description.trim(),
					name: name.trim(),
				},
				projectId,
			});
			const applicationUrl = setApplicationId(
				setProjectId(Navigation.Applications, projectId),
				application.id,
			);
			setRedirectUrl(applicationUrl);

			addApplication(projectId, application);
			showInfo(t('applicationCreated'));

			if (apiKeyName.trim()) {
				const apiKey = await handleCreateAPIKey({
					applicationId: application.id,
					data: {
						name: apiKeyName.trim(),
					},
					projectId,
				});
				setAPIKey(apiKey.hash);
			} else {
				onClose();
				router.replace(applicationUrl);
			}
		} catch (e) {
			showError((e as ApiError).message);
		} finally {
			setLoading(false);
			setName('');
			setDescription('');
			setAPIKeyName('');
		}
	}

	function close() {
		onClose();
		setAPIKey(null);
		if (redirectUrl) {
			router.replace(redirectUrl);
		}
	}

	if (apiKey) {
		return (
			<CreateApiKey
				projectId={''}
				applicationId={''}
				onCancel={close}
				onSubmit={close}
				initialAPIKeyHash={apiKey}
			/>
		);
	}

	return (
		<div data-testid="create-application-container" className="bg-base-300">
			<main className="p-10 pb-20 flex flex-col border-b border-neutral">
				<h1 className="font-bold text-xl text-base-content text-center">
					{t('createApplication')}
				</h1>

				<div className="mt-14">
					<label
						htmlFor="applicationName"
						className="block text-neutral-content text-xl font-medium"
					>
						{t('applicationName')}
					</label>
					<input
						id="applicationName"
						type="text"
						data-testid="create-application-name-input"
						placeholder={t('applicationNamePlaceholder')}
						className="input w-[60%] mt-2.5"
						value={name}
						onChange={handleChange(setName)}
					/>
				</div>

				<div>
					<label
						htmlFor="applicationDescription"
						className="text-neutral-content text-xl font-medium mt-5 flex"
					>
						{t('applicationDescription')}
						<span className="text-sm font-medium text-neutral ml-auto">
							{t('optional')}
						</span>
					</label>
					<input
						id="applicationDescription"
						type="text"
						data-testid="create-application-description-input"
						placeholder={t('applicationDescriptionPlaceholder')}
						className="input w-full mt-2.5"
						value={description}
						onChange={handleChange(setDescription)}
					/>
				</div>

				<div>
					<label
						htmlFor="createApiKey"
						className="text-neutral-content text-xl font-medium mt-5 flex"
					>
						{t('createApiKey')}
						<span className="text-sm font-medium text-neutral ml-auto">
							{t('optional')}
						</span>
					</label>
					<input
						id="createApiKey"
						type="text"
						data-testid="create-application-api-key-input"
						placeholder={t('createApiKeyPlaceholder')}
						className="input w-full mt-2.5"
						value={apiKeyName}
						onChange={handleChange(setAPIKeyName)}
					/>
				</div>
			</main>
			<div className="flex py-8 px-5 gap-6">
				<button
					data-testid="create-application-cancel-btn"
					onClick={close}
					className="btn btn-neutral ml-auto capitalize"
				>
					{t('cancel')}
				</button>
				<button
					onClick={() => void createApplication()}
					data-testid="create-application-submit-btn"
					disabled={!isValid}
					className="btn btn-primary capitalize"
				>
					{loading ? (
						<span className="loading loading-spinner loading-xs mx-14" />
					) : (
						t('createApplication')
					)}
				</button>
			</div>
		</div>
	);
}

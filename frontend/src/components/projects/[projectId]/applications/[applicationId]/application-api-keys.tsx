import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { Eraser, Plus } from 'react-bootstrap-icons';
import useSWR, { useSWRConfig } from 'swr';

import { handleDeleteAPIKey, handleRetrieveAPIKeys } from '@/api';
import { CreateApiKey } from '@/components/projects/[projectId]/applications/[applicationId]/application-create-api-key';
import { ResourceDeletionBanner } from '@/components/resource-deletion-banner';
import { ApiError } from '@/errors';
import { useApiKeys, useSetAPIKeys } from '@/stores/api-store';
import { useShowError } from '@/stores/toast-store';
import { useDateFormat } from '@/stores/user-config-store';
import { APIKey } from '@/types';

export function ApplicationApiKeys({
	projectId,
	applicationId,
}: {
	applicationId: string;
	projectId: string;
}) {
	const t = useTranslations('application');
	const dateFormat = useDateFormat();
	const showError = useShowError();
	const { mutate } = useSWRConfig();
	const [loading, setLoading] = useState(false);

	const apiKeys = useApiKeys(applicationId);
	const setAPIKeys = useSetAPIKeys();

	const deletionDialogRef = useRef<HTMLDialogElement>(null);
	const creationDialogRef = useRef<HTMLDialogElement>(null);
	const [deletionAPIKey, setDeletionAPIKey] = useState<Pick<
		APIKey,
		'name' | 'id'
	> | null>(null);

	function openDeleteConfirmationPopup(apiKeyId: string, apiKeyName: string) {
		setDeletionAPIKey({ id: apiKeyId, name: apiKeyName });
		deletionDialogRef.current?.showModal();
	}

	function closeDeleteConfirmationPopup() {
		setDeletionAPIKey(null);
		deletionDialogRef.current?.close();
	}

	function openCreationPopup() {
		creationDialogRef.current?.showModal();
	}

	function closeCreationPopup() {
		creationDialogRef.current?.close();
	}

	const { isLoading } = useSWR(
		{
			applicationId,
			projectId,
		},
		handleRetrieveAPIKeys,
		{
			/* c8 ignore start */
			onError({ message }: ApiError) {
				showError(message);
			},
			/* c8 ignore end */
			onSuccess(apiKeys) {
				setAPIKeys(applicationId, apiKeys);
				closeCreationPopup();
			},
		},
	);

	async function deleteAPIKey(apiKeyId: string) {
		if (loading) {
			return;
		}

		try {
			setLoading(true);

			await handleDeleteAPIKey({ apiKeyId, applicationId, projectId });
			await mutate({ applicationId, projectId });
		} catch (e) {
			showError((e as ApiError).message);
		} finally {
			closeDeleteConfirmationPopup();
			setLoading(false);
		}
	}

	function renderApiKeys() {
		if (isLoading) {
			return (
				<div className="w-full flex mb-6">
					<span className="loading loading-bars mx-auto" />
				</div>
			);
		}
		if (!apiKeys?.length) {
			return null;
		}

		return (
			<table className="custom-table mb-16">
				<thead>
					<tr>
						<th>{t('name')}</th>
						<th>{t('createdAt')}</th>
						<th>{t('delete')}</th>
					</tr>
				</thead>
				<tbody>
					{apiKeys.map(({ name, createdAt, id }) => (
						<tr data-testid="api-key-row" key={id}>
							<td data-testid="api-key-name">
								<span className="text-info">{name}</span>
							</td>
							<td>
								<span className="text-info">
									{dayjs(createdAt).format(dateFormat)}
								</span>
							</td>
							<td>
								<button
									data-testid="api-key-delete-btn"
									onClick={() => {
										openDeleteConfirmationPopup(id, name);
									}}
								>
									<Eraser className="w-3.5 h-3.5 text-error" />
								</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		);
	}

	return (
		<div data-testid="application-api-keys-container">
			<h2
				data-testid="api-keys-title"
				className="font-semibold text-white text-xl"
			>
				{t('apiKeys')}
			</h2>
			<div className="custom-card">
				{renderApiKeys()}
				<button
					data-testid="api-key-create-btn"
					onClick={openCreationPopup}
					className="flex gap-2 items-center text-secondary hover:brightness-90"
				>
					<Plus className="text-secondary w-4 h-4 hover:brightness-90" />
					<span>{t('newApiKey')}</span>
				</button>
				<dialog ref={deletionDialogRef} className="modal">
					<div className="dialog-box">
						{deletionAPIKey && (
							<ResourceDeletionBanner
								title={t('warning')}
								description={t('warningMessageAPIKey')}
								placeholder={t('deletePlaceholderAPIKey')}
								resourceName={deletionAPIKey.name}
								onCancel={closeDeleteConfirmationPopup}
								onConfirm={() =>
									void deleteAPIKey(deletionAPIKey.id)
								}
								confirmCTA={
									loading ? (
										<span className="loading loading-spinner loading-xs mx-1.5" />
									) : undefined
								}
							/>
						)}
					</div>
					<form method="dialog" className="modal-backdrop">
						<button />
					</form>
				</dialog>
				<dialog ref={creationDialogRef} className="modal">
					<div className="dialog-box">
						<CreateApiKey
							projectId={projectId}
							applicationId={applicationId}
							onCancel={closeCreationPopup}
							onSubmit={() => {
								closeCreationPopup();
								void mutate({ applicationId, projectId });
							}}
						/>
					</div>
				</dialog>
			</div>
		</div>
	);
}

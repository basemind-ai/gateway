import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { Eraser, Plus } from 'react-bootstrap-icons';
import useSWR, { useSWRConfig } from 'swr';

import { handleDeleteAPIKey, handleRetrieveAPIKeys } from '@/api';
import { CreateApiKey } from '@/components/projects/[projectId]/applications/[applicationId]/create-api-key';
import { ResourceDeletionBanner } from '@/components/resource-deletion-banner';
import { ApiError } from '@/errors';
import { useAPIKeys, useSetAPIKeys } from '@/stores/project-store';
import { useShowError } from '@/stores/toast-store';
import { useDateFormat } from '@/stores/user-config-store';
import { APIKey } from '@/types';

export function ApiKeys({
	projectId,
	applicationId,
}: {
	projectId: string;
	applicationId: string;
}) {
	const t = useTranslations('application');
	const dateFormat = useDateFormat();
	const showError = useShowError();
	const { mutate } = useSWRConfig();
	const [loading, setLoading] = useState(false);

	const apiKeys = useAPIKeys(applicationId);
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
			projectId,
			applicationId,
		},
		handleRetrieveAPIKeys,
		{
			onError({ message }: ApiError) {
				showError(message);
			},
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

			await handleDeleteAPIKey({ projectId, applicationId, apiKeyId });
			await mutate({ projectId, applicationId });
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
							<td data-testid="api-key-name">{name}</td>
							<td>{dayjs(createdAt).format(dateFormat)}</td>
							<td>
								<button
									data-testid="api-key-delete-btn"
									onClick={() => {
										openDeleteConfirmationPopup(id, name);
									}}
								>
									<Eraser className="w-3.5 h-3.5 text-accent" />
								</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		);
	}

	return (
		<>
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
								void mutate({ projectId, applicationId });
							}}
						/>
					</div>
				</dialog>
			</div>
		</>
	);
}

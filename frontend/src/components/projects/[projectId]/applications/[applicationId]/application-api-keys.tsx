import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Plus, XCircle } from 'react-bootstrap-icons';
import useSWR, { useSWRConfig } from 'swr';

import { handleDeleteAPIKey, handleRetrieveAPIKeys } from '@/api';
import { CardHeaderWithTooltip } from '@/components/card-header-with-tooltip';
import { Modal } from '@/components/modal';
import { CreateApplicationAPIKeyModal } from '@/components/projects/[projectId]/applications/[applicationId]/application-create-api-key';
import { ResourceDeletionBanner } from '@/components/resource-deletion-banner';
import { useHandleError } from '@/hooks/use-handle-error';
import { useApiKeys, useSetAPIKeys } from '@/stores/api-store';
import { useDateFormat } from '@/stores/user-config-store';
import { APIKey, Application } from '@/types';

export function ApplicationApiKeys({
	projectId,
	application,
}: {
	application: Application;
	projectId: string;
}) {
	const t = useTranslations('application');
	const dateFormat = useDateFormat();
	const handleError = useHandleError();
	const { mutate } = useSWRConfig();
	const [loading, setLoading] = useState(false);

	const apiKeys = useApiKeys(application.id);
	const setAPIKeys = useSetAPIKeys();

	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [deletionAPIKey, setDeletionAPIKey] = useState<Pick<
		APIKey,
		'name' | 'id'
	> | null>(null);

	function openDeleteConfirmationPopup(apiKeyId: string, apiKeyName: string) {
		setDeletionAPIKey({ id: apiKeyId, name: apiKeyName });
		setIsDeleteModalOpen(true);
	}

	function closeDeleteConfirmationPopup() {
		setDeletionAPIKey(null);
		setIsDeleteModalOpen(false);
	}

	function openCreationPopup() {
		setIsCreateModalOpen(true);
	}

	function closeCreationPopup() {
		setIsCreateModalOpen(false);
	}

	const { isLoading } = useSWR(
		{
			applicationId: application.id,
			projectId,
		},
		handleRetrieveAPIKeys,
		{
			onError: handleError,
			onSuccess(apiKeys) {
				setAPIKeys(application.id, apiKeys);
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

			await handleDeleteAPIKey({
				apiKeyId,
				applicationId: application.id,
				projectId,
			});
			await mutate({ applicationId: application.id, projectId });
		} catch (e) {
			handleError(e);
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
			<table className="table mb-4">
				<thead>
					<tr>
						<th>{t('name')}</th>
						<th>{t('creationDate')}</th>
						<th className="text-right">{t('revoke')}</th>
					</tr>
				</thead>
				<tbody>
					{apiKeys.map(({ name, createdAt, id }) => (
						<tr data-testid="api-key-row" key={id}>
							<td data-testid="api-key-name">
								<span className="text-base-content">
									{name}
								</span>
							</td>
							<td>
								<span className="text-base-content">
									{dayjs(createdAt).format(dateFormat)}
								</span>
							</td>
							<td className="text-end">
								<button
									data-testid="api-key-delete-btn"
									className="pr-4"
									onClick={() => {
										openDeleteConfirmationPopup(id, name);
									}}
								>
									<XCircle className="w-3.5 h-3.5 text-warning hover:text-error" />
								</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		);
	}

	return (
		<div data-testid="application-api-keys-container" className="mt-9">
			<CardHeaderWithTooltip
				dataTestId={t('apiKeys')}
				headerText={t('apiKeys')}
				tooltipText={t('tooltipAPIKeysView')}
			/>
			<div className="rounded-data-card">
				{renderApiKeys()}
				<button
					data-testid="api-key-create-btn"
					onClick={openCreationPopup}
					className="card-action-button-outline btn-primary"
				>
					<Plus className="w-4 h-4" />
					<span>{t('newApiKey')}</span>
				</button>
				<Modal modalOpen={isDeleteModalOpen}>
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
									<span className="loading loading-spinner loading-xs mx-1.5 text-base-content" />
								) : undefined
							}
						/>
					)}
				</Modal>
				<Modal modalOpen={isCreateModalOpen}>
					<CreateApplicationAPIKeyModal
						projectId={projectId}
						applicationId={application.id}
						onCancel={closeCreationPopup}
						onSubmit={() => {
							closeCreationPopup();
							void mutate({
								applicationId: application.id,
								projectId,
							});
						}}
					/>
				</Modal>
			</div>
		</div>
	);
}

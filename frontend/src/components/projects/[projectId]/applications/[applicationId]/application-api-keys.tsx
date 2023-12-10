import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Eraser, Plus } from 'react-bootstrap-icons';
import useSWR, { useSWRConfig } from 'swr';

import { handleDeleteAPIKey, handleRetrieveAPIKeys } from '@/api';
import { CardHeaderWithTooltip } from '@/components/card-header-with-tooltip';
import { Modal } from '@/components/modal';
import { CreateApplicationAPIKeyModal } from '@/components/projects/[projectId]/applications/[applicationId]/application-create-api-key';
import { ResourceDeletionBanner } from '@/components/resource-deletion-banner';
import { useHandleError } from '@/hooks/use-handle-error';
import { useTrackPage } from '@/hooks/use-track-page';
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
	useTrackPage('applications-api-keys');
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
					className="flex gap-2 items-center text-secondary hover:brightness-90"
				>
					<Plus className="text-secondary w-4 h-4 hover:brightness-90" />
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
									<span className="loading loading-spinner loading-xs mx-1.5" />
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

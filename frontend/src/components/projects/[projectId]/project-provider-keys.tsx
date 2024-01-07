import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Plus, Trash } from 'react-bootstrap-icons';
import useSWR from 'swr';

import {
	handleDeleteProviderKey,
	handleRetrieveProviderKeys,
} from '@/api/provider-keys-api';
import { CardHeaderWithTooltip } from '@/components/card-header-with-tooltip';
import { Modal } from '@/components/modal';
import { ProjectProviderKeyCreateModal } from '@/components/projects/[projectId]/project-provider-key-create-modal';
import { ResourceDeletionBanner } from '@/components/resource-deletion-banner';
import { modelVendorToLocaleMap } from '@/constants/models';
import { useHandleError } from '@/hooks/use-handle-error';
import { useProviderKeys, useSetProviderKeys } from '@/stores/api-store';
import { ModelVendor, Project, ProviderKey } from '@/types';

export function ProjectProviderKeys({ project }: { project: Project }) {
	const t = useTranslations('providerKeys');

	const handleError = useHandleError();
	const providerKeys = useProviderKeys();
	const setProviderKeys = useSetProviderKeys();

	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [providerKeyIdToDelete, setProviderKeyIdToDelete] = useState<
		string | undefined
	>();

	const [isLoading, setIsLoading] = useState(false);

	const { isLoading: isSWRLoading } = useSWR(
		{
			projectId: project.id,
		},
		handleRetrieveProviderKeys,
		{
			onError: handleError,
			onSuccess(data) {
				setProviderKeys(data);
			},
		},
	);

	if (isSWRLoading) {
		return <div className="loading" data-testid="loader" />;
	}

	const vendorsWithKeys = new Set(providerKeys.map((key) => key.modelVendor));
	const vendorsWithoutKeys = Object.values(ModelVendor).filter(
		(value) => !vendorsWithKeys.has(value),
	);

	const deleteProviderKey = async () => {
		const providerKeyId = providerKeyIdToDelete!;
		setIsLoading(true);
		try {
			await handleDeleteProviderKey({
				projectId: project.id,
				providerKeyId,
			});
		} catch (e) {
			handleError(e);
		} finally {
			setIsLoading(false);
			setProviderKeyIdToDelete(undefined);
			setProviderKeys(providerKeys.filter((v) => v.id !== providerKeyId));
			setIsDeleteModalOpen(false);
		}
	};

	return (
		<div>
			<CardHeaderWithTooltip
				headerText={t('headline')}
				tooltipText={t('headlineToolTip')}
				dataTestId={t('headlineToolTip')}
			/>
			<div className="rounded-data-card flex flex-col">
				<table
					className="table mb-16"
					data-testid="provider-keys-table"
				>
					<thead>
						<tr>
							<th data-testid="provider-keys-table-header">
								{t('modelVendor')}
							</th>
							<th data-testid="provider-keys-table-header">
								{t('createdAt')}
							</th>
							<th data-testid="provider-keys-table-header">
								{t('actions')}
							</th>
						</tr>
					</thead>
					<tbody>
						{providerKeys.map((value) => (
							<tr
								key={value.id}
								className="hover"
								data-testid="provider-keys-table-row"
							>
								<td data-testid="key-provider-name">
									{modelVendorToLocaleMap[value.modelVendor]}
								</td>
								<td data-testid="key-created-at">
									{value.createdAt}
								</td>
								<td data-testid="key-actions">
									<span className="flex justify-center">
										<button
											className="btn btn-ghost"
											data-testid="delete-provider-key-button"
											onClick={() => {
												setProviderKeyIdToDelete(
													value.id,
												);
												setIsDeleteModalOpen(true);
											}}
										>
											<Trash className="text-red-400" />
										</button>
									</span>
								</td>
							</tr>
						))}
					</tbody>
				</table>
				<button
					data-testid="new-provider-key-btn"
					onClick={() => {
						setIsCreateModalOpen(true);
					}}
					disabled={!vendorsWithoutKeys.length}
					className="flex gap-2 items-center text-secondary hover:brightness-90"
				>
					<Plus className="text-secondary w-4 h-4 hover:brightness-90" />
					<span>{t('newProviderKey')}</span>
				</button>
			</div>
			<Modal modalOpen={isCreateModalOpen}>
				<div className="p-8">
					<ProjectProviderKeyCreateModal
						projectId={project.id}
						vendors={vendorsWithoutKeys}
						closeModal={() => {
							setIsCreateModalOpen(false);
						}}
						addProviderKey={(providerKey: ProviderKey) => {
							setProviderKeys([...providerKeys, providerKey]);
						}}
					/>
				</div>
			</Modal>
			<Modal modalOpen={isDeleteModalOpen}>
				{providerKeyIdToDelete && (
					<ResourceDeletionBanner
						title={t('warning')}
						description={t('deleteProviderKeyWarning')}
						onConfirm={() => {
							void deleteProviderKey();
						}}
						confirmCTA={
							isLoading ? (
								<span
									className="loading loading-spinner loading-xs mx-1.5 text-base-content"
									data-testid="delete-key-loader"
								/>
							) : undefined
						}
						onCancel={() => {
							setProviderKeyIdToDelete(undefined);
							setIsDeleteModalOpen(false);
						}}
					/>
				)}
			</Modal>
		</div>
	);
}

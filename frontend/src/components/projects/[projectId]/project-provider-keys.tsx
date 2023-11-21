import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { Plus, Trash } from 'react-bootstrap-icons';

import { handleDeleteProviderKey } from '@/api/provider-keys-api';
import { ProviderKeyCreateModal } from '@/components/projects/[projectId]/provider-key-create-modal';
import { ResourceDeletionBanner } from '@/components/resource-deletion-banner';
import { ApiError } from '@/errors';
import { useSwrProviderKeys } from '@/hooks/use-swr-provider-keys';
import { useShowError } from '@/stores/toast-store';
import { ModelVendor, ProviderKey } from '@/types';

export function ProjectProviderKeys({ projectId }: { projectId: string }) {
	const t = useTranslations('providerKeys');

	const showError = useShowError();

	const deletionDialogRef = useRef<HTMLDialogElement>(null);
	const creationDialogRef = useRef<HTMLDialogElement>(null);

	const [providerKeyIdToDelete, setProviderKeyIdToDelete] = useState<
		string | undefined
	>();

	const [isLoading, setIsLoading] = useState(false);

	const {
		isLoading: swrIsLoading,
		providerKeys,
		setProviderKeys,
	} = useSwrProviderKeys({ projectId });

	if (swrIsLoading) {
		return <div className="loading" data-testid="loader" />;
	}

	const vendorsWithKeys = new Set(providerKeys.map((key) => key.modelVendor));
	const vendorsWithoutKeys = Object.values(ModelVendor).filter(
		(value) => !vendorsWithKeys.has(value),
	);

	const openCreateModal = () => {
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		creationDialogRef.current?.showModal?.();
	};

	/* c8 ignore start */
	const closeCreateModal = () => {
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		creationDialogRef.current?.close?.();
	};
	/* c8 ignore end */

	const openDeleteModal = () => {
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		deletionDialogRef.current?.showModal?.();
	};

	const closeDeleteModal = () => {
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		deletionDialogRef.current?.close?.();
	};

	const deleteProviderKey = async () => {
		const providerKeyId = providerKeyIdToDelete!;
		setIsLoading(true);
		try {
			await handleDeleteProviderKey({
				projectId,
				providerKeyId,
			});
		} catch (e) {
			showError((e as ApiError).message);
		} finally {
			setIsLoading(false);
			setProviderKeyIdToDelete(undefined);
			setProviderKeys(providerKeys.filter((v) => v.id !== providerKeyId));
			closeDeleteModal();
		}
	};

	return (
		<div>
			<table
				className="custom-table mb-16"
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
								{value.modelVendor}
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
											setProviderKeyIdToDelete(value.id);
											openDeleteModal();
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
			<div className="custom-card flex flex-col">
				<button
					data-testid="new-provider-key-btn"
					onClick={openCreateModal}
					disabled={!vendorsWithoutKeys.length}
					className="flex gap-2 items-center text-secondary hover:brightness-90"
				>
					<Plus className="text-secondary w-4 h-4 hover:brightness-90" />
					<span>{t('newProviderKey')}</span>
				</button>
			</div>
			<dialog ref={creationDialogRef} className="modal">
				<div className="dialog-box border-2 rounded p-10">
					<ProviderKeyCreateModal
						projectId={projectId}
						vendors={vendorsWithoutKeys}
						closeModal={closeCreateModal}
						addProviderKey={(providerKey: ProviderKey) => {
							setProviderKeys([...providerKeys, providerKey]);
						}}
					/>
				</div>
				<form method="dialog" className="modal-backdrop">
					<button />
				</form>
			</dialog>
			<dialog ref={deletionDialogRef} className="modal">
				<div className="dialog-box">
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
										className="loading loading-spinner loading-xs mx-1.5"
										data-testid="delete-key-loader"
									/>
								) : undefined
							}
							onCancel={() => {
								setProviderKeyIdToDelete(undefined);
								closeDeleteModal();
							}}
						/>
					)}
				</div>
				<form method="dialog" className="modal-backdrop">
					<button />
				</form>
			</dialog>
		</div>
	);
}

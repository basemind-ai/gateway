import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { Plus, Trash } from 'react-bootstrap-icons';
import useSWR from 'swr';

import {
	handleCreateProviderKey,
	handleDeleteProviderKey,
	handleRetrieveProviderKeys,
} from '@/api/provider-keys-api';
import { ResourceDeletionBanner } from '@/components/resource-deletion-banner';
import { modelVendorsTranslationKeyMap } from '@/constants/models';
import { ApiError } from '@/errors';
import { useShowError } from '@/stores/toast-store';
import { ModelVendor, ProviderKey } from '@/types';
import { handleChange } from '@/utils/events';

export function ProviderKeyCreateModal({
	vendors,
	projectId,
	closeModal,
	setProviderKeys,
}: {
	closeModal: () => void;
	projectId: string;
	setProviderKeys: (
		setter: (prevState: ProviderKey[]) => ProviderKey[],
	) => void;
	vendors: string[];
}) {
	const t = useTranslations('providerKeys');
	const showError = useShowError();

	const [isLoading, setIsLoading] = useState(false);
	const [keyValue, setKeyValue] = useState<string>('');
	const [selectedVendor, setSelectedVendor] = useState<string | undefined>();

	const handleSubmit = async () => {
		setIsLoading(true);

		try {
			const providerKey = await handleCreateProviderKey({
				data: {
					key: keyValue.trim(),
					modelVendor: selectedVendor as ModelVendor,
				},
				projectId,
			});
			setProviderKeys((prevState) => [...prevState, providerKey]);
		} catch (e: unknown) {
			showError((e as ApiError).message);
		} finally {
			setKeyValue('');
			setSelectedVendor(undefined);
			setIsLoading(false);
			closeModal();
		}
	};

	return (
		<div
			data-testid="create-provider-key-modal"
			className="flex flex-col justify-evenly"
		>
			<span
				className="font-semibold text-center"
				data-testid="create-provider-key-modal-title"
			>
				{t('createProviderKey')}
			</span>
			<div className="flex flex-col justify-evenly">
				<div className="form-control p-2">
					<label className="label">
						<span className="label-text">{t('modelVendor')}</span>
					</label>
					<select
						data-testid="vendor-select"
						value={selectedVendor}
						defaultValue={undefined}
						onChange={handleChange(setSelectedVendor)}
						className="select select-bordered rounded w-full"
					>
						<option value={undefined}>{t('selectVendor')}</option>
						{vendors.map((value) => (
							<option
								key={value}
								value={value}
								data-testid="model-vendor-option"
							>
								{t(
									modelVendorsTranslationKeyMap[
										value as ModelVendor
									],
								)}
							</option>
						))}
					</select>
				</div>
				<div className="form-control p-2">
					<label className="label">
						<span className="label-text">{t('keyValue')}</span>
					</label>
					<textarea
						data-testid="key-value-textarea"
						className="textarea textarea-bordered rounded w-full"
						value={keyValue}
						onChange={handleChange(setKeyValue)}
					/>
				</div>
			</div>
			<div className="flex justify-between m-2">
				<button
					className="btn btn-outline rounded"
					data-testid="create-provider-key-cancel-btn"
					onClick={closeModal}
				>
					{t('cancel')}
				</button>
				<button
					className="btn btn-primary rounded"
					data-testid="create-provider-key-submit-btn"
					disabled={isLoading || !selectedVendor || !keyValue.trim()}
					onClick={() => {
						void handleSubmit();
					}}
				>
					{isLoading ? (
						<span
							className="loading loading-spinner"
							data-testid="spinner"
						/>
					) : (
						t('createKey')
					)}
				</button>
			</div>
		</div>
	);
}

export function ProjectProviderKeys({ projectId }: { projectId: string }) {
	const t = useTranslations('providerKeys');

	const showError = useShowError();

	const deletionDialogRef = useRef<HTMLDialogElement>(null);
	const creationDialogRef = useRef<HTMLDialogElement>(null);

	const [providerKeyIdToDelete, setProviderKeyIdToDelete] = useState<
		string | undefined
	>();
	const [providerKeys, setProviderKeys] = useState<ProviderKey[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	const { isLoading: swrIsLoading } = useSWR(
		{
			projectId,
		},
		handleRetrieveProviderKeys,
		{
			onError(apiError: ApiError) {
				showError(apiError.message);
			},
			onSuccess(data) {
				setProviderKeys(data);
			},
		},
	);

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
			setProviderKeys((prevState) =>
				prevState.filter((v) => v.id !== providerKeyId),
			);
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
						setProviderKeys={setProviderKeys}
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

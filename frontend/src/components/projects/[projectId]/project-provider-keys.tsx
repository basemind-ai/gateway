import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { Plus } from 'react-bootstrap-icons';
import useSWR from 'swr';

import {
	handleCreateProviderKey,
	handleRetrieveProviderKeys,
} from '@/api/provider-keys-api';
import { ApiError } from '@/errors';
import { useShowError } from '@/stores/toast-store';
import { ModelVendor, ProviderKey } from '@/types';
import { handleChange } from '@/utils/helpers';

const modelVendorsTranslationKeyMap: Record<ModelVendor, string> = {
	[ModelVendor.OpenAI]: 'openai',
	[ModelVendor.Cohere]: 'cohere',
};

export function ProviderKeyCreateModal({
	vendors,
	projectId,
	closeModal,
}: {
	vendors: string[];
	projectId: string;
	closeModal: () => void;
}) {
	const t = useTranslations('providerKeys');

	const showError = useShowError();

	const [selectedVendor, setSelectedVendor] = useState<string | undefined>();
	const [keyValue, setKeyValue] = useState<string>('');
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async () => {
		setIsLoading(true);

		try {
			await handleCreateProviderKey({
				projectId,
				data: {
					modelVendor: selectedVendor as ModelVendor,
					key: keyValue.trim(),
				},
			});
		} catch (e: unknown) {
			showError((e as ApiError).message);
		} finally {
			setIsLoading(false);
			closeModal();
		}
	};

	return (
		<div
			data-testid="create-provider-key-modal"
			className="flex flex-col justify-evenly"
		>
			<div className="form-control">
				<label className="label">
					<span className="label-text">{t('modelVendor')}</span>
				</label>
				<select
					data-testid="vendor-select"
					value={selectedVendor}
					defaultValue={undefined}
					onChange={handleChange(setSelectedVendor)}
					className="select"
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
			<div className="form-control">
				<label className="label">
					<span className="label-text">{t('keyValue')}</span>
				</label>
				<input
					type="text"
					className="input"
					value={keyValue}
					onChange={handleChange(setKeyValue)}
				/>
			</div>
			<button
				className="btn btn-primary self-end mt-2"
				data-testid="create-provider-key-submit-btn"
				disabled={isLoading || !selectedVendor || !keyValue.trim()}
				onClick={() => {
					void handleSubmit();
				}}
			>
				{isLoading ? (
					<span className="loading loading-spinner" />
				) : (
					t('createKey')
				)}
			</button>
		</div>
	);
}

export function ProjectProviderKeys({ projectId }: { projectId: string }) {
	const t = useTranslations('providerKeys');

	const showError = useShowError();

	const [providerKeys, setProviderKeys] = useState<ProviderKey[]>([]);
	const dialogRef = useRef<HTMLDialogElement>(null);

	const { isLoading } = useSWR(
		{
			projectId,
		},
		handleRetrieveProviderKeys,
		{
			onSuccess(data) {
				setProviderKeys(data);
			},
			/* c8 ignore start */
			onError(apiError: ApiError) {
				showError(apiError.message);
			},
			/* c8 ignore end */
		},
	);

	if (isLoading) {
		return <div className="loading" />;
	}

	const vendorsWithKeys = new Set(providerKeys.map((key) => key.modelVendor));
	const vendorsWithoutKeys = Object.values(ModelVendor).filter(
		(value) => !vendorsWithKeys.has(value),
	);

	const closeModal = () => {
		dialogRef.current?.close();
	};

	return (
		<div>
			<table className="custom-table mb-16">
				<thead>
					<tr>
						<th>{t('modelVendor')}</th>
						<th>{t('createdAt')}</th>
					</tr>
				</thead>
				<tbody>
					{providerKeys.map((value) => (
						<tr key={value.id}>
							<td>{value.modelVendor}</td>
							<td>{value.createdAt}</td>
						</tr>
					))}
				</tbody>
			</table>
			<div className="custom-card flex flex-col">
				<button
					data-testid="new-application-btn"
					onClick={() => {
						dialogRef.current?.showModal();
					}}
					disabled={!dialogRef.current || !vendorsWithoutKeys.length}
					className="flex gap-2 items-center text-secondary hover:brightness-90"
				>
					<Plus className="text-secondary w-4 h-4 hover:brightness-90" />
					<span>{t('newProviderKey')}</span>
				</button>
			</div>
			<dialog ref={dialogRef} className="modal">
				<div className="dialog-box border-0 rounded-none">
					<ProviderKeyCreateModal
						projectId={projectId}
						vendors={vendorsWithoutKeys}
						closeModal={closeModal}
					/>
				</div>
				<form method="dialog" className="modal-backdrop">
					<button />
				</form>
			</dialog>
		</div>
	);
}

import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { Plus, Trash } from 'react-bootstrap-icons';
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
	closeModal: () => void;
	projectId: string;
	vendors: string[];
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
				data: {
					key: keyValue.trim(),
					modelVendor: selectedVendor as ModelVendor,
				},
				projectId,
			});
		} catch (e: unknown) {
			showError((e as ApiError).message);
		} finally {
			setKeyValue('');
			// eslint-disable-next-line unicorn/no-useless-undefined
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
			<span className="font-semibold text-center">
				Create Provider Key
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
						className="textarea textarea-bordered rounded w-full"
						value={keyValue}
						onChange={handleChange(setKeyValue)}
					/>
				</div>
			</div>
			<button
				className="btn btn-primary rounded self-end m-2"
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
			/* c8 ignore start */
			onError(apiError: ApiError) {
				showError(apiError.message);
			},

			onSuccess(data) {
				setProviderKeys(data);
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

	const openModal = () => {
		dialogRef.current?.showModal();
	};

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
						<th />
					</tr>
				</thead>
				<tbody>
					{providerKeys.map((value) => (
						<tr key={value.id}>
							<td>{value.modelVendor}</td>
							<td>{value.createdAt}</td>
							<td>
								<Trash />
							</td>
						</tr>
					))}
				</tbody>
			</table>
			<div className="custom-card flex flex-col">
				<button
					data-testid="new-application-btn"
					onClick={openModal}
					disabled={!vendorsWithoutKeys.length}
					className="flex gap-2 items-center text-secondary hover:brightness-90"
				>
					<Plus className="text-secondary w-4 h-4 hover:brightness-90" />
					<span>{t('newProviderKey')}</span>
				</button>
			</div>
			<dialog ref={dialogRef} className="modal">
				<div className="dialog-box border-2 rounded p-10">
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

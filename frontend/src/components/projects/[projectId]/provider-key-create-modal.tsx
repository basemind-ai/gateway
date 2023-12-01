import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { InfoCircle } from 'react-bootstrap-icons';

import { handleCreateProviderKey } from '@/api/provider-keys-api';
import { modelVendorToLocaleMap } from '@/constants/models';
import { useHandleError } from '@/hooks/use-handle-error';
import { ModelVendor, ProviderKey } from '@/types';
import { handleChange } from '@/utils/events';

export function ProviderKeyCreateModal({
	vendors,
	projectId,
	closeModal,
	addProviderKey,
	modelVendor,
	handleCancel,
}: {
	addProviderKey: (providerKey: ProviderKey) => void;
	closeModal: () => void;
	handleCancel?: () => void;
	modelVendor?: ModelVendor;
	projectId: string;
	vendors: ModelVendor[];
}) {
	const t = useTranslations('providerKeys');
	const handleError = useHandleError();

	const [isLoading, setIsLoading] = useState(false);
	const [keyValue, setKeyValue] = useState<string>('');
	const [selectedVendor, setSelectedVendor] = useState<
		ModelVendor | undefined
	>(modelVendor);

	const handleSubmit = async () => {
		setIsLoading(true);

		try {
			const providerKey = await handleCreateProviderKey({
				data: {
					key: keyValue.trim(),
					modelVendor: selectedVendor!,
				},
				projectId,
			});
			addProviderKey(providerKey);
		} catch (e: unknown) {
			handleError(e);
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
				{modelVendor ? (
					<div>
						<p className="p-4 text-sm">
							{t('providerKeyIsRequiredMessage', {
								modelVendor:
									modelVendorToLocaleMap[modelVendor],
							})}
						</p>
						<p className="px-4 text-xs flex gap-2">
							<InfoCircle className="w-4 h-4" />
							<span>{t('keyIsEncryptedMessage')}</span>
						</p>
					</div>
				) : (
					<div className="form-control p-2">
						<label className="label">
							<span className="label-text">
								{t('modelVendor')}
							</span>
						</label>
						<select
							data-testid="vendor-select"
							value={selectedVendor}
							defaultValue={undefined}
							onChange={handleChange(setSelectedVendor)}
							className="card-select"
						>
							<option value={undefined}>
								{t('selectVendor')}
							</option>
							{vendors.map((value) => (
								<option
									key={value}
									value={value}
									data-testid="model-vendor-option"
								>
									{modelVendorToLocaleMap[value]}
								</option>
							))}
						</select>
					</div>
				)}
				<div className="form-control p-2">
					<label className="label">
						<span
							className={`label-text ${modelVendor && 'hidden'}`}
						>
							{t('keyValue')}
						</span>
					</label>
					<textarea
						data-testid="key-value-textarea"
						className="card-textarea"
						value={keyValue}
						onChange={handleChange(setKeyValue)}
					/>
				</div>
			</div>
			<div className="flex justify-end gap-4 m-2">
				<button
					className="btn btn-neutral"
					data-testid="create-provider-key-cancel-btn"
					onClick={handleCancel ?? closeModal}
				>
					{t('cancel')}
				</button>
				<button
					className="btn btn-primary"
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

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { handleChange } from '@/utils/helpers';

export interface ResourceDeletionBannerProps {
	title: string;
	description: string;
	resourceName: string;
	placeholder?: string;
	onCancel: () => void;
	onConfirm: () => void;
}

export function ResourceDeletionBanner({
	title,
	description,
	resourceName,
	placeholder = '',
	onCancel,
	onConfirm,
}: ResourceDeletionBannerProps) {
	const t = useTranslations('deletionBanner');
	const [confirmText, setConfirmText] = useState('');

	const disabled = confirmText !== resourceName;
	return (
		<div className="bg-base-300">
			<div className="p-10 flex flex-col items-center border-b border-neutral">
				<h1
					data-testid="resource-deletion-title"
					className="text-error font-bold text-xl"
				>
					{title}
				</h1>
				<p
					data-testid="resource-deletion-description"
					className="mt-2.5 font-medium "
				>
					{description}
				</p>
				<div className="mt-8 self-start">
					<label
						htmlFor="deletion-input"
						className="text-xl text-neutral-content"
					>
						{t('continueMessage')}
						<span
							data-testid="resource-deletion-resource-name"
							className="text-info"
						>
							"{resourceName}"
						</span>
					</label>
					<input
						type="text"
						id="deletion-input"
						data-testid="resource-deletion-input"
						className="input mt-2.5 bg-neutral w-full text-neutral-content font-medium"
						placeholder={placeholder}
						value={confirmText}
						onChange={handleChange(setConfirmText)}
					/>
				</div>
			</div>
			<div className="flex items-center justify-end py-8 px-5 gap-4">
				<button
					data-testid="resource-deletion-cancel-btn"
					onClick={onCancel}
					className="btn btn-neutral capitalize font-semibold text-neutral-content"
				>
					{t('cancel')}
				</button>
				<button
					data-testid="resource-deletion-delete-btn"
					onClick={onConfirm}
					disabled={disabled}
					className={`btn bg-error text-accent-content capitalize font-semibold ${
						disabled ? 'opacity-60' : ''
					}`}
				>
					{t('delete')}
				</button>
			</div>
		</div>
	);
}

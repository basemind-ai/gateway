import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { handleChange } from '@/utils/events';

export interface ResourceDeletionBannerProps {
	confirmCTA?: string | React.ReactElement;
	description: string;
	errorMessage?: string;
	isDisabled?: boolean;
	onCancel: () => void;
	onConfirm: () => void;
	placeholder?: string;
	resourceName?: string;
	title: string;
}

export function ResourceDeletionBanner({
	title,
	description,
	resourceName,
	placeholder = '',
	onCancel,
	onConfirm,
	confirmCTA,
	isDisabled,
	errorMessage,
}: ResourceDeletionBannerProps) {
	const t = useTranslations('deletionBanner');
	const [confirmText, setConfirmText] = useState('');

	const disabled =
		!isDisabled && resourceName ? confirmText !== resourceName : false;

	return (
		<div className="bg-base-300">
			<div
				className={`p-10 flex flex-col items-center ${
					resourceName && 'border-b border-neutral'
				}`}
			>
				<h1
					data-testid="resource-deletion-title"
					className="text-error font-bold text-2xl pb-5"
				>
					{title}
				</h1>
				<p
					data-testid="resource-deletion-description"
					className="mt-2.5 text-lg"
				>
					{description}
				</p>
				{resourceName && (
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
								{resourceName}
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
				)}
			</div>
			<div className="flex grow items-center justify-between py-8 px-5 gap-4">
				<span className="text-error text-xs font-light">
					{errorMessage}
				</span>
				<div className="flex gap-4">
					<button
						data-testid="resource-deletion-cancel-btn"
						onClick={onCancel}
						className="btn btn-neutral capitalize"
					>
						{t('cancel')}
					</button>
					<button
						data-testid="resource-deletion-delete-btn"
						onClick={onConfirm}
						disabled={disabled}
						className="btn btn-error capitalize"
					>
						{confirmCTA ?? t('delete')}
					</button>
				</div>
			</div>
		</div>
	);
}

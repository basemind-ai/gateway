import { useTranslations } from 'next-intl';
import { useState } from 'react';
import isEmail from 'validator/es/lib/isEmail';

import { handleChange } from '@/utils/events';

export function PasswordResetModal({
	handleResetPassword,
	handleCloseModal,
}: {
	handleCloseModal: () => void;
	handleResetPassword: (email: string) => Promise<void>;
}) {
	const t = useTranslations('signin');

	const [email, setEmail] = useState('');

	const emailValid = isEmail(email);

	return (
		<div data-testid="password-reset-modal" className="bg-base-100">
			<div
				className="form-control"
				data-testid="password-reset-input-container"
			>
				<label
					className="label p-5 flex justify-center"
					data-testid="password-reset-input-label"
				>
					<span className="label-text">{t('emailLabel')}</span>
				</label>
				<input
					type="email"
					placeholder={t('emailPlaceholder')}
					className="input input-sm w-full border-none bg-base-100"
					data-testid="password-reset-input"
					onChange={handleChange(setEmail)}
				/>
			</div>
			<div
				className="flex justify-between pt-5 pr-2 pb-4"
				data-testid="password-reset-button-container"
			>
				<button
					className="btn btn-rounded btn-sm btn-neutral"
					data-testid="password-reset-cancel-button"
					onClick={handleCloseModal}
				>
					{t('cancel')}
				</button>
				<button
					className="btn btn-rounded btn-sm btn-info"
					data-testid="password-reset-submit-button"
					onClick={() => {
						void handleResetPassword(email);
					}}
					disabled={!emailValid}
				>
					{t('resetPassword')}
				</button>
			</div>
		</div>
	);
}

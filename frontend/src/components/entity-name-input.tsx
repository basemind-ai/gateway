import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';

import { MIN_NAME_LENGTH } from '@/constants';
import { handleChange } from '@/utils/events';

export function EntityNameInput({
	value,
	setValue,
	isLoading,
	placeholder,
	setIsValid,
	setIsChanged,
	dataTestId,
	validateValue,
}: {
	dataTestId: string;
	isLoading: boolean;
	placeholder?: string;
	setIsChanged?: (isValid: boolean) => void;
	setIsValid?: (isValid: boolean) => void;
	setValue: (value: string) => void;
	validateValue: (value: string) => boolean;
	value: string;
}) {
	const t = useTranslations('entityNameInput');

	const initialValue = useRef(value);
	const isNameValid = validateValue(value);
	const isLengthValid = value.trim().length >= MIN_NAME_LENGTH;

	useEffect(() => {
		if (setIsValid) {
			setIsValid(isLengthValid && isNameValid);
		}
	}, [isLengthValid, isNameValid]);

	useEffect(() => {
		if (setIsChanged) {
			setIsChanged(value !== initialValue.current);
		}
	}, [value]);

	const handleSetValue = (v: string) => {
		setValue(v.trim());
	};

	const validationError = isLengthValid ? (
		isNameValid ? (
			<br className="pt-2" data-testid="name-message-placeholder" />
		) : (
			<p
				className="text-sm text-error text-center pt-2"
				data-testid="invalid-name-message"
			>
				{t('invalidNameErrorMessage')}
			</p>
		)
	) : (
		<p
			className="text-sm text-error text-center pt-2"
			data-testid="invalid-length-message"
		>
			{t('invalidLengthErrorMessage', {
				numCharacters: MIN_NAME_LENGTH,
			})}
		</p>
	);

	return (
		<div className="form-control">
			<label className="label">
				<span className="label-text">{t('entityNameInputLabel')}</span>
				{(!isLengthValid || !isNameValid) && (
					<span
						className="label-text-alt"
						data-testid="label-help-text"
					>
						{t('entityNameInputLabelAlt')}
					</span>
				)}
			</label>
			<input
				type="text"
				data-testid={dataTestId}
				className={
					isLengthValid && isNameValid
						? 'card-input'
						: 'card-input border-red-500'
				}
				value={value}
				disabled={isLoading}
				placeholder={placeholder}
				onChange={handleChange(handleSetValue)}
			/>
			{validationError}
		</div>
	);
}

import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef } from 'react';

import { MIN_NAME_LENGTH } from '@/constants';
import { usePromptConfigs } from '@/stores/api-store';
import { handleChange } from '@/utils/events';

export function PromptConfigNameInput({
	value,
	setValue,
	isLoading,
	promptConfigId,
	applicationId,
	placeholder,
	setIsValid,
	setIsChanged,
	dataTestId,
}: {
	applicationId: string;
	dataTestId: string;
	isLoading: boolean;
	placeholder?: string;
	promptConfigId?: string;
	setIsChanged?: (isValid: boolean) => void;
	setIsValid: (isValid: boolean) => void;
	setValue: (value: string) => void;
	value: string;
}) {
	const t = useTranslations('createConfigWizard');

	const initialValue = useRef(value);

	const promptConfigs = usePromptConfigs();

	const promptConfigNames = useMemo(
		() =>
			promptConfigs[applicationId]
				?.filter((c) => c.id !== promptConfigId)
				.map((c) => c.name) ?? [],
		[promptConfigs, applicationId, promptConfigId],
	);

	const nameIsValid = !promptConfigNames.includes(value);
	const lengthIsValid = value.trim().length >= MIN_NAME_LENGTH;

	useEffect(() => {
		setIsValid(lengthIsValid && nameIsValid);
	}, [lengthIsValid, nameIsValid]);

	useEffect(() => {
		if (setIsChanged) {
			setIsChanged(value !== initialValue.current);
		}
	}, [value]);

	const handleSetValue = (v: string) => {
		setValue(v.trim());
	};

	const validationError = lengthIsValid ? (
		nameIsValid ? (
			<br className="pt-2" />
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
				<span className="label-text">
					{t('promptConfigNameInputLabel')}
				</span>
				{(!lengthIsValid || !nameIsValid) && (
					<span
						className="label-text-alt"
						data-testid="label-help-text"
					>
						{t('promptConfigNameInputLabelAlt')}
					</span>
				)}
			</label>
			<input
				type="text"
				data-testid={dataTestId}
				className={
					lengthIsValid && nameIsValid
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

import { useTranslations } from 'next-intl';

import { handleChange } from '@/utils/events';

export interface DropdownOption<
	T extends string | number | undefined = undefined,
> {
	text: string;
	value: T;
}
export function Dropdown<T extends string | number | undefined = undefined>({
	placeholderText,
	value,
	setSelected,
	options,
	labelText,
	isLoading = false,
	isOptional = false,
	testId,
}: {
	isLoading?: boolean;
	isOptional?: boolean;
	labelText: string;
	options: DropdownOption<T>[];
	placeholderText: string;
	setSelected: (value: T) => void;
	testId: string;
	value: T;
}) {
	const t = useTranslations('common');
	return (
		<div
			className="form-control w-full max-w-xs"
			data-testid="dropdown-container"
		>
			<label className="label">
				<span className="label-text">{labelText}</span>
				{isOptional && (
					<span className="label-text-alt"> {t('optional')}</span>
				)}
			</label>
			<select
				className="select w-full bg-neutral text-neutral-content"
				value={value}
				onChange={handleChange(setSelected)}
				data-testid={testId}
				disabled={isLoading}
				required={!isOptional}
			>
				<option value={undefined}>{placeholderText}</option>
				{options.map((option) => (
					<option
						key={option.value}
						value={option.value}
						data-testid="dropdown-option"
					>
						{option.text}
					</option>
				))}
			</select>
		</div>
	);
}

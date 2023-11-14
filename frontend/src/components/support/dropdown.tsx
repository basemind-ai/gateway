import { useTranslations } from 'next-intl';

import { handleChange } from '@/utils/helpers';

export interface DropdownOption {
	text: string;
	value: string;
}
interface DropdownProps {
	headline: string;
	isLoading?: boolean;
	optional?: boolean;
	options: DropdownOption[];
	selected?: string;
	setSelected: (value: any) => void;
}

export function Dropdown({
	headline,
	selected = '',
	setSelected,
	options,
	isLoading = false,
	optional = false,
}: DropdownProps) {
	const t = useTranslations('common');
	return (
		<div className="form-control w-full max-w-xs">
			<label className="label">
				<span className="label-text">{headline}</span>
				{optional && (
					<span className="label-text-alt"> {t('optional')}</span>
				)}
			</label>
			<select
				className="select w-full max-w-xs bg-neutral text-neutral-content"
				value={selected}
				onChange={handleChange(setSelected)}
				data-testid={`dropdown-input-select-${headline}`}
			>
				<option value={''}>{headline}</option>
				{isLoading ? (
					<option value={''} className="animate-pulse">
						Loading...
					</option>
				) : (
					options.map((option) => (
						<option
							key={option.value}
							value={option.value}
							data-testid={option.value}
						>
							{option.text}
						</option>
					))
				)}
			</select>
		</div>
	);
}

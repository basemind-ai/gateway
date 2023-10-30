import { handleChange } from '@/utils/helpers';

interface DropdownProps {
	headline: string;
	selected: string;
	setSelected: (value: any) => void;
	options: string[];
}

export function Dropdown({
	headline,
	selected,
	setSelected,
	options,
}: DropdownProps) {
	return (
		<div className="form-control w-full max-w-xs">
			<label className="label">
				<span className="label-text">{headline}</span>
			</label>
			<select
				className="select w-full max-w-xs bg-neutral text-neutral-content"
				value={selected}
				onChange={handleChange(setSelected)}
				data-testid="dropdown-input-select"
			>
				{options.map((option, index) => (
					<option
						key={option}
						value={option}
						data-testid={option}
						disabled={index === 0}
					>
						{option}
					</option>
				))}
			</select>
		</div>
	);
}

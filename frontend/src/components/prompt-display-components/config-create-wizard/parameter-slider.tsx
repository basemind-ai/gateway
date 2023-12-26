import { InfoCircle } from 'react-bootstrap-icons';

import { handleChange } from '@/utils/events';
import { formatNumber } from '@/utils/format';

export function ParameterSlider({
	key,
	toolTipText,
	labelText,
	min,
	max,
	step,
	value,
	setter,
}: {
	key: string;
	labelText: string;
	max: number;
	min: number;
	setter: (value: number) => void;
	step: number;
	toolTipText: string;
	value: number;
}) {
	return (
		<div className="form-control min-w-xs" key={key}>
			<label className="label">
				<div
					className="tooltip flex items-center gap-1 pr-3"
					data-tip={toolTipText}
					data-testid={`${key}-tooltip`}
				>
					<span className="label-text">{labelText}</span>
					<InfoCircle className="w-3 h-3" />
				</div>
				<span className="label-text-alt">{formatNumber(value)}</span>
			</label>
			<input
				type="range"
				min={min}
				max={max}
				step={step}
				value={value}
				onChange={handleChange((value: string) => {
					setter(Number.parseFloat(value));
				})}
				className="range range-xs"
				data-testid={`create-prompt-config-dialog-model-parameter-range-${key}`}
			/>
		</div>
	);
}

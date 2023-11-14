import Datepicker, { DateValueType } from 'react-tailwindcss-datepicker';

import { DateFormat } from '@/constants';

export interface DatePickerProps {
	displayFormat?: DateFormat;
	onValueChange: (value: DateValueType) => void;
	showShortcuts?: boolean;
	useRange?: boolean;
	value: DateValueType;
}

export function DatePicker({
	showShortcuts = true,
	useRange = true,
	displayFormat = DateFormat.ISO,
	value,
	onValueChange,
}: DatePickerProps) {
	return (
		<div data-testid="datepicker">
			<Datepicker
				inputClassName="bg-transparent relative transition-all duration-300 py-2.5 pl-4 pr-14 w-full text-neutral-content tracking-medium font-medium text-sm placeholder-gray-400 disabled:opacity-40 disabled:cursor-not-allowed"
				value={value}
				onChange={onValueChange}
				showShortcuts={showShortcuts}
				useRange={useRange}
				displayFormat={displayFormat}
			/>
		</div>
	);
}

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
		<div className="custom-datepicker" data-testid="datepicker">
			<Datepicker
				primaryColor="violet"
				inputClassName="bg-transparent w-60 rounded relative transition-all duration-300  py-0 my-0 border-0 pl-4 pr-12 text-neutral-content tracking-medium font-medium text-sm placeholder-gray-400 disabled:opacity-40 disabled:cursor-not-allowed focus:border-slate-100 no-ring-color"
				value={value}
				onChange={onValueChange}
				showShortcuts={showShortcuts}
				useRange={useRange}
				displayFormat={displayFormat}
			/>
		</div>
	);
}

import { useState } from 'react';
import Datepicker, { DateValueType } from 'react-tailwindcss-datepicker';

export interface DatePickerProps {
	showShortcuts: boolean;
	useRange: boolean;
	displayFormat: string;
}

export function DatePicker({
	showShortcuts,
	useRange,
	displayFormat,
}: DatePickerProps) {
	const [value, setValue] = useState<DateValueType>({
		startDate: new Date(),
		endDate: new Date().setMonth(11).toString(),
	});

	const handleValueChange = (newValue: DateValueType) => {
		setValue(newValue);
	};

	return (
		<div data-testid="datepicker">
			<Datepicker
				value={value}
				onChange={handleValueChange}
				showShortcuts={showShortcuts}
				useRange={useRange}
				displayFormat={displayFormat}
			/>
		</div>
	);
}

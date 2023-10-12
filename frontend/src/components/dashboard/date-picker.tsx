import { useState } from 'react';
import Datepicker, { DateValueType } from 'react-tailwindcss-datepicker';

export function DatePicker() {
	const [value, setValue] = useState<DateValueType>({
		startDate: new Date(),
		endDate: new Date().setMonth(11).toString(),
	});

	const handleValueChange = (newValue: DateValueType) => {
		setValue(newValue);
	};

	return (
		<div>
			<Datepicker
				value={value}
				onChange={handleValueChange}
				showShortcuts={true}
				useRange={false}
				displayFormat="DD/MM/YYYY"
			/>
		</div>
	);
}

import { fireEvent, render, screen } from 'tests/test-utils';

import { DatePicker } from '@/components/dashboard/date-picker';

describe('Date Picker tests', () => {
	const dateRange = {
		endDate: new Date(),
		startDate: new Date(),
	};
	const onDateChange = vi.fn();

	it('render date picker', () => {
		render(
			<DatePicker
				showShortcuts={true}
				useRange={false}
				value={dateRange}
				onValueChange={onDateChange}
			/>,
		);

		const datePicker = screen.getByTestId('datepicker');
		expect(datePicker).toBeInTheDocument();
	});

	it('render date picker calendar text', () => {
		render(
			<DatePicker
				showShortcuts={true}
				useRange={false}
				value={dateRange}
				onValueChange={onDateChange}
			/>,
		);

		const datePicker = screen.getByTestId('datepicker');
		fireEvent.click(datePicker);

		expect(screen.getByText('Today')).toBeInTheDocument();

		expect(screen.getByText('Yesterday')).toBeInTheDocument();
	});

	it('render date picker calendar date', () => {
		render(
			<DatePicker
				showShortcuts={true}
				useRange={false}
				value={dateRange}
				onValueChange={onDateChange}
			/>,
		);

		const datePicker = screen.getByTestId('datepicker');
		fireEvent.click(datePicker);

		const todayBtn = screen.getByText('Today');
		fireEvent.click(todayBtn);

		expect(onDateChange).toHaveBeenCalled();

		expect(screen.getByRole('presentation')).toBeInTheDocument();
	});
});

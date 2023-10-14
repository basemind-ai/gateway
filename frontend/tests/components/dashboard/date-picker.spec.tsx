import { fireEvent, render, screen } from 'tests/test-utils';

import { DatePicker } from '@/components/dashboard/date-picker';

describe('Date Picker tests', () => {
	it('render date picker', async () => {
		render(
			<DatePicker
				showShortcuts={true}
				useRange={false}
				displayFormat="DD/MM/YYYY"
			/>,
		);

		const datePicker = screen.getByTestId('datepicker');
		expect(datePicker).toBeInTheDocument();
	});

	it('render date picker calendar text', async () => {
		render(
			<DatePicker
				showShortcuts={true}
				useRange={false}
				displayFormat="DD/MM/YYYY"
			/>,
		);

		const datePicker = screen.getByTestId('datepicker');
		fireEvent.click(datePicker);

		expect(screen.getByText('Today')).toBeInTheDocument();

		expect(screen.getByText('Yesterday')).toBeInTheDocument();
	});

	it('render date picker calendar date', async () => {
		render(
			<DatePicker
				showShortcuts={true}
				useRange={false}
				displayFormat="DD/MM/YYYY"
			/>,
		);

		const datePicker = screen.getByTestId('datepicker');
		fireEvent.click(datePicker);

		const todayBtn = screen.getByText('Today');
		fireEvent.click(todayBtn);

		expect(screen.getByRole('presentation')).toBeInTheDocument();
	});
});

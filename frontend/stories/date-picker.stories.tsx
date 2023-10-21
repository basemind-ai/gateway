import {
	DatePicker,
	DatePickerProps,
} from '@/components/dashboard/date-picker';

export default {
	title: 'Date Picker Component',
	component: DatePicker,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
};

const oneWeekAgo = new Date();
oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

export const Default = {
	args: {
		showShortcuts: true,
		useRange: false,
		displayFormat: 'DD/MM/YYYY',
		value: {
			startDate: oneWeekAgo,
			endDate: new Date(),
		},
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		onValueChange: () => {},
	} satisfies DatePickerProps,
};

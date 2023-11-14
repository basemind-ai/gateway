import {
	DatePicker,
	DatePickerProps,
} from '@/components/dashboard/date-picker';

export default {
	component: DatePicker,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
	title: 'Date Picker Component',
};

const oneWeekAgo = new Date();
oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

export const Default = {
	args: {
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		onValueChange: () => {},

		showShortcuts: true,

		useRange: false,

		value: {
			endDate: new Date(),
			startDate: oneWeekAgo,
		},
	} satisfies DatePickerProps,
};

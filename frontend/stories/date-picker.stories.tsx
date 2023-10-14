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

export const Default = {
	args: {
		showShortcuts: true,
		useRange: false,
		displayFormat: 'DD/MM/YYYY',
	} satisfies DatePickerProps,
};

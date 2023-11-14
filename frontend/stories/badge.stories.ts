import Badge, { BadgeProps } from '@/components/navrail/badge';

export default {
	component: Badge,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
	title: 'Badge Component',
};

export const Default = {
	args: {
		fillColor: 'bg-base-200',
		text: 'example text',
		textColor: 'text-primary',
	} satisfies BadgeProps,
};

import Badge, { BadgeProps } from '@/components/navrail/badge';

export default {
	title: 'Badge Component',
	component: Badge,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
};

export const Default = {
	args: {
		fillColor: 'bg-base-200',
		textColor: 'text-primary',
		text: 'example text',
	} satisfies BadgeProps,
};

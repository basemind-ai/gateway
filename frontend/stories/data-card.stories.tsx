import { DataCard, DataCardProps } from '@/components/dashboard/data-card';

export default {
	title: 'Data Card Component',
	component: DataCard,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
};

export const Default = {
	args: {
		imageSrc: '/images/graph.svg',
		metric: 'API Calls',
		totalValue: '32k',
		currentValue: '16000',
		percentage: '100%',
	} satisfies DataCardProps,
};

export const User = {
	args: {
		imageSrc: '/images/user.svg',
		metric: 'Users',
		totalValue: '4.5K',
		currentValue: '400',
		percentage: '22%',
	} satisfies DataCardProps,
};

export const Cost = {
	args: {
		imageSrc: '/images/cash.svg',
		metric: 'Models Cost',
		totalValue: '120$',
		currentValue: '60',
		percentage: '100%',
	} satisfies DataCardProps,
};

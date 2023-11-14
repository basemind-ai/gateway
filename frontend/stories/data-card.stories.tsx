import { Activity, Cash, Person } from 'react-bootstrap-icons';

import { DataCard, DataCardProps } from '@/components/dashboard/data-card';

export default {
	component: DataCard,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
	title: 'Data Card Component',
};

export const Default = {
	args: {
		currentValue: '16000',
		imageSrc: <Activity />,
		metric: 'API Calls',
		percentage: '100%',
		totalValue: '32k',
	} satisfies DataCardProps,
};

export const User = {
	args: {
		currentValue: '400',
		imageSrc: <Person />,
		metric: 'Users',
		percentage: '22%',
		totalValue: '4.5K',
	} satisfies DataCardProps,
};

export const Cost = {
	args: {
		currentValue: '60',
		imageSrc: <Cash />,
		metric: 'Models Cost',
		percentage: '100%',
		totalValue: '120$',
	} satisfies DataCardProps,
};

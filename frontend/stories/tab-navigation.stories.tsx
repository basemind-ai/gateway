import { useState } from 'react';
import { Gear, KeyFill, Speedometer2 } from 'react-bootstrap-icons';

import { TabNavigation, TabNavigationProps } from '@/components/tab-navigation';

export default {
	component: TabNavigation,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
	title: 'Tab Navigation Component',
};
function Template(
	props: Omit<TabNavigationProps, 'onTabChange' | 'selectedTab'>,
) {
	const [value, setValue] = useState<string>(props.tabs[0].text);
	const onChangeInput = (inputValue: string) => {
		setValue(inputValue);
	};
	return (
		<TabNavigation
			{...props}
			selectedTab={value}
			onTabChange={onChangeInput}
		/>
	);
}

export const Default = {
	args: {
		tabs: [
			{
				icon: <Speedometer2 className="w-3.5 h-3.5" />,
				id: '1',
				text: 'Arcane Arts',
			},
			{
				icon: <Gear className="w-3.5 h-3.5" />,
				id: '2',
				text: 'Magic Circles',
			},
			{
				icon: <KeyFill className="w-3.5 h-3.5" />,
				id: '3',
				text: 'Bane',
			},
		],
	},
	render: (args: TabNavigationProps) => {
		return <Template {...args} />;
	},
};

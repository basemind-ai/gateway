import { ReactElement } from 'react';

export interface TabData<T = string> {
	icon?: ReactElement;
	id: T;
	text: string;
}

export interface TabNavigationProps<T = string> {
	onTabChange: (tab: T) => void;
	selectedTab: T;
	tabs: TabData<T>[];
	trailingLine?: boolean;
}

export function TabNavigation<T = string>({
	tabs,
	selectedTab,
	onTabChange,
	trailingLine,
}: TabNavigationProps<T>) {
	return (
		<nav className="tabs">
			{tabs.map((tab) => (
				<button
					data-testid="tab-navigation-btn"
					key={tab.text}
					className={`tab tab-bordered font-medium text-neutral-content border-neutral flex flex-row gap-2 items-center h-full py-3 px-4 ${
						tab.id === selectedTab
							? 'tab-active text-secondary border-secondary'
							: ''
					}`}
					onClick={() => {
						onTabChange(tab.id);
					}}
				>
					{tab.icon}
					<span>{tab.text}</span>
				</button>
			))}
			{trailingLine && (
				<div className="tab tab-bordered flex-1 cursor-default min-w-0 border-neutral" />
			)}
		</nav>
	);
}

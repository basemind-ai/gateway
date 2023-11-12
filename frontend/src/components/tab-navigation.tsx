import { ReactElement } from 'react';

export interface TabData<T = string> {
	id: T;
	text: string;
	icon?: ReactElement;
}

export interface TabNavigationProps<T = string> {
	tabs: TabData<T>[];
	selectedTab: T;
	onTabChange: (tab: T) => void;
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

import { ReactElement, useEffect } from 'react';

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
	// on the first load of the component we check for a preset hash.
	// this allows us to link to specific tabs in a page.
	useEffect(() => {
		const tab = tabs.find(
			(t) => window.location.hash.slice(1) === `tab-${t.id}`,
		);
		if (tab) {
			onTabChange(tab.id);
			window.location.hash = '';
		}
	}, []);

	return (
		<nav className="tabs tabs-boxed bg-base-100">
			{tabs.map((tab) => (
				<button
					data-testid="tab-navigation-btn"
					key={tab.text}
					className={`tab text-neutral-content gap-2 hover:bg-neutral/80 ${
						tab.id === selectedTab
							? 'tab-active bg-neutral text-neutral-content'
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
				<div className="tab tabs-bordered flex-1 cursor-default min-w-0 border-neutral" />
			)}
		</nav>
	);
}

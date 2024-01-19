import { fireEvent, render, screen } from 'tests/test-utils';

import { TabData, TabNavigation } from '@/components/tab-navigation';

describe('TabNavigation tests', () => {
	const tabData: TabData[] = [
		{
			id: '1',
			text: 'General',
		},
		{
			id: '2',
			text: 'Settings',
		},
	];

	beforeEach(() => {
		vi.resetAllMocks();
	});

	it('renders navigation', () => {
		const onTabChange = vi.fn();
		render(
			<TabNavigation
				tabs={tabData}
				selectedTab={tabData[0].id}
				onTabChange={onTabChange}
				trailingLine={true}
			/>,
		);

		const tabs = screen.getAllByTestId('tab-navigation-btn');
		expect(tabs).toHaveLength(2);

		expect(tabs[0]).toHaveClass('tab-active');
		expect(tabs[1]).not.toHaveClass('tab-active');

		expect(tabs[0].innerHTML).toContain(tabData[0].text);
	});

	it('changes tab when clicked', () => {
		const onTabChange = vi.fn();

		const { container } = render(
			<TabNavigation
				tabs={tabData}
				selectedTab={tabData[0].id}
				onTabChange={onTabChange}
				trailingLine={true}
			/>,
		);

		const tabs = screen.getAllByTestId('tab-navigation-btn');

		fireEvent.click(tabs[1]);

		expect(onTabChange).toHaveBeenCalledWith(tabData[1].id);

		render(
			<TabNavigation
				tabs={tabData}
				onTabChange={onTabChange}
				trailingLine={true}
				selectedTab={tabData[1].id}
			/>,
			{
				container,
			},
		);

		const updatedTabs = screen.getAllByTestId('tab-navigation-btn');
		expect(updatedTabs[0]).not.toHaveClass('tab-active');
		expect(updatedTabs[1]).toHaveClass('tab-active');
	});

	it(`loads the hash from the url and sets the tab accordingly`, async () => {
		const onTabChange = vi.fn();

		window.location.hash = '#tab-2';
		render(
			<TabNavigation
				tabs={tabData}
				selectedTab={tabData[0].id}
				onTabChange={onTabChange}
				trailingLine={true}
			/>,
		);

		expect(onTabChange).toHaveBeenCalledWith(tabData[1].id);
		expect(window.location.hash).toBe('');
	});
});

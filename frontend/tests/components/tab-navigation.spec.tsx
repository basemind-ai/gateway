import { fireEvent } from '@testing-library/react';
import { render, screen } from 'tests/test-utils';
import { beforeEach, expect } from 'vitest';

import { TabNavigation, TabNavigationProps } from '@/components/tab-navigation';

describe('TabNavigation tests', () => {
	const props: TabNavigationProps = {
		tabs: [
			{
				id: '1',
				text: 'General',
			},
			{
				id: '2',
				text: 'Settings',
			},
		],
		selectedTab: '1',
		onTabChange: vi.fn(),
	};

	beforeEach(() => {
		vi.resetAllMocks();
	});

	it('renders navigation', () => {
		render(<TabNavigation {...props} />);

		const tabs = screen.getAllByTestId('tab-navigation-btn');
		expect(tabs).toHaveLength(2);

		expect(tabs[0]).toHaveClass('tab-active');
		expect(tabs[1]).not.toHaveClass('tab-active');

		expect(tabs[0].innerHTML).toContain(props.tabs[0].text);
	});

	it('changes tab when clicked', () => {
		const { container } = render(<TabNavigation {...props} />);

		const tabs = screen.getAllByTestId('tab-navigation-btn');

		fireEvent.click(tabs[1]);

		expect(props.onTabChange).toHaveBeenCalledWith(props.tabs[1].id);

		render(<TabNavigation {...props} selectedTab={props.tabs[1].id} />, {
			container,
		});

		const updatedTabs = screen.getAllByTestId('tab-navigation-btn');
		expect(updatedTabs[0]).not.toHaveClass('tab-active');
		expect(updatedTabs[1]).toHaveClass('tab-active');
	});
});

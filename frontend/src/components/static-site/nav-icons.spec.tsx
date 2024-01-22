import { mockTrack } from 'tests/mocks';
import { render, screen, waitFor } from 'tests/test-utils';

import { NavIcons, NavigationTabs } from '@/components/static-site/nav-icons';

describe('NavIcons Tests', () => {
	global.open = vi.fn();
	it('should render a list of icons', () => {
		render(<NavIcons />);
		for (const iconData of NavigationTabs) {
			const icon = screen.getByTestId(`${iconData.name}-btn`);
			expect(icon).toBeInTheDocument();
		}
	});

	it('should call track analytics when an icon is clicked', async () => {
		render(<NavIcons />);
		const icon = screen.getByTestId(`${NavigationTabs[0].name}-btn`);
		icon.click();
		await waitFor(() => {
			expect(mockTrack).toHaveBeenCalledWith(
				`${NavigationTabs[0].name.charAt(0).toUpperCase() + NavigationTabs[0].name.split('-')[0].slice(1)} Clicked`,
				expect.any(Object),
				expect.any(Object),
			);
		});
	});

	it('should call window open on click', async () => {
		render(<NavIcons />);
		const icon = screen.getByTestId(`${NavigationTabs[0].name}-btn`);
		icon.click();
		await waitFor(() => {
			expect(window.open).toHaveBeenCalledWith(NavigationTabs[0].url);
		});
	});
});

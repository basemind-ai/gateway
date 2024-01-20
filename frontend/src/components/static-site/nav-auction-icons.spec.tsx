import { mockTrack } from 'tests/mocks';
import { render, screen, waitFor } from 'tests/test-utils';

import {
	NavAuctionIcons,
	NavAuctionIconsList,
} from '@/components/static-site/nav-auction-icons';

describe('NavAuctionIcons Tests', () => {
	global.open = vi.fn();
	it('should render a list of icons', () => {
		render(<NavAuctionIcons />);
		for (const iconData of NavAuctionIconsList) {
			const icon = screen.getByTestId(`${iconData.name}-btn`);
			expect(icon).toBeInTheDocument();
		}
	});

	it('should call track analytics when an icon is clicked', async () => {
		render(<NavAuctionIcons />);
		const icon = screen.getByTestId(`${NavAuctionIconsList[0].name}-btn`);
		icon.click();
		await waitFor(() => {
			expect(mockTrack).toHaveBeenCalledWith(
				`${NavAuctionIconsList[0].name.charAt(0).toUpperCase() + NavAuctionIconsList[0].name.split('-')[0].slice(1)} Clicked`,
				expect.any(Object),
				expect.any(Object),
			);
		});
	});

	it('should call window open on click', async () => {
		render(<NavAuctionIcons />);
		const icon = screen.getByTestId(`${NavAuctionIconsList[0].name}-btn`);
		icon.click();
		await waitFor(() => {
			expect(window.open).toHaveBeenCalledWith(
				NavAuctionIconsList[0].url,
			);
		});
	});
});

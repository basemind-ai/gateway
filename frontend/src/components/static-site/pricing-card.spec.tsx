import { mockTrack, routerPushMock } from 'tests/mocks';
import { fireEvent, render, screen, waitFor } from 'tests/test-utils';

import { PricingCard } from '@/components/static-site/pricing-card';
import { firstPackagePerks } from '@/components/static-site/pricing-section';
import { Navigation } from '@/constants';

describe('PricingCard Tests', () => {
	global.open = vi.fn();

	it('clicking on cta should send analytic event', async () => {
		render(
			<PricingCard
				title="test"
				displayCost="stes"
				perks={firstPackagePerks}
				cta="test-signup"
				url={Navigation.SignIn}
			/>,
		);
		const button = screen.getByTestId('test-pricing-card-cta');
		fireEvent.click(button);
		await waitFor(() => {
			expect(mockTrack).toHaveBeenCalledWith(
				'test_click',
				expect.any(Object),
			);
		});
	});
	it('click on cta when link is internal should call push router', async () => {
		render(
			<PricingCard
				title="test"
				displayCost="stes"
				perks={firstPackagePerks}
				cta="test-signup"
				url={Navigation.SignIn}
			/>,
		);
		const button = screen.getByTestId('test-pricing-card-cta');
		fireEvent.click(button);
		await waitFor(() => {
			expect(routerPushMock).toHaveBeenCalledWith(Navigation.SignIn);
		});
	});
	it('click on cta when link is external should call window.open', async () => {
		render(
			<PricingCard
				title="test"
				displayCost="stes"
				perks={firstPackagePerks}
				cta="test-signup"
				url="https://www.test.com"
			/>,
		);
		const button = screen.getByTestId('test-pricing-card-cta');
		fireEvent.click(button);
		await waitFor(() => {
			expect(window.open).toHaveBeenCalledWith('https://www.test.com');
		});
	});
});

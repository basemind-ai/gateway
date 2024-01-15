import { mockPage, mockReady, routerPushMock } from 'tests/mocks';
import { render, screen, waitFor } from 'tests/test-utils';

import LandingPage from '@/app/[locale]/page';
import { Navigation } from '@/constants';

describe('Landing Page', () => {
	it('should replace the route to Sign-In when clicking on the Sign-In button', () => {
		render(<LandingPage params={{ locale: 'en' }} />);
		const button = screen.getByTestId('header-sign-in-button');
		button.click();
		expect(routerPushMock).toHaveBeenCalledWith(
			Navigation.SignIn,
			Navigation.SignIn,
			{
				locale: undefined,
				scroll: true,
				shallow: undefined,
			},
		);
	});

	it('calls page tracking hook', async () => {
		render(<LandingPage params={{ locale: 'en' }} />);
		await waitFor(() => {
			expect(mockReady).toHaveBeenCalled();
		});
		await waitFor(() => {
			expect(mockPage).toHaveBeenCalledWith(
				'landing-page',
				expect.any(Object),
			);
		});
	});
	it('should render all sections', () => {
		const sections = [
			'static-site-header',
			'landing-page-hero',
			'landing-page-features',
			'landing-page-benefits',
			'landing-page-pricing',
			'landing-page-faq',
			'landing-page-cta',
			'static-site-footer',
		];
		render(<LandingPage params={{ locale: 'en' }} />);
		sections.forEach((section) => {
			expect(screen.getByTestId(section)).toBeInTheDocument();
		});
	});
});

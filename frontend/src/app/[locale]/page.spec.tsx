import { waitFor } from '@testing-library/react';
import { routerPushMock } from 'tests/mocks';
import { render, screen } from 'tests/test-utils';

import LandingPage from '@/app/[locale]/page';
import { Navigation } from '@/constants';
import { usePageTracking } from '@/hooks/use-page-tracking';

describe('Landing Page', () => {
	it('should replace the route to Sign-In when clicking the Sign-Up button', () => {
		render(<LandingPage />);
		const button = screen.getByTestId('intro-section-signup-button');
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

	it('should replace the route to Sign-In when clicking on the Sign-In button', () => {
		render(<LandingPage />);
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

	it('call page tracking hook', async () => {
		render(<LandingPage />);
		await waitFor(() => {
			expect(usePageTracking).toHaveBeenCalledWith('landing-page');
		});
	});
});

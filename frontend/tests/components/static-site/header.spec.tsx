import { routerPushMock } from 'tests/mocks';
import { fireEvent, render, screen } from 'tests/test-utils';

import { StaticPageHeader } from '@/components/static-site/header';
import { Navigation } from '@/constants';

describe('LandingPageHeader', () => {
	it('should render a header component with a logo and a sign-up button', () => {
		render(<StaticPageHeader />);
		const header = screen.getByTestId('static-site-header');
		const logo = screen.getByTestId('logo-component');
		const signUpButton = screen.getByTestId('header-sign-in-button');

		expect(header).toBeInTheDocument();
		expect(logo).toBeInTheDocument();
		expect(signUpButton).toBeInTheDocument();
	});

	it('logo click should navigate to home page', () => {
		render(<StaticPageHeader />);
		const logo = screen.getByTestId('logo-component');
		fireEvent.click(logo);

		expect(routerPushMock).toHaveBeenCalledWith(
			Navigation.Base,
			Navigation.Base,
			{
				locale: undefined,
				scroll: true,
				shallow: undefined,
			},
		);
	});

	it('sign-in click should navigate to signup', () => {
		render(<StaticPageHeader />);
		const signInButton = screen.getByTestId('header-sign-in-button');
		fireEvent.click(signInButton);

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
});

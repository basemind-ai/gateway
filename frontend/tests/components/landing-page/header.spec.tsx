import { fireEvent, render, screen } from 'tests/test-utils';

import { LandingPageHeader } from '@/components/landing-page/header';

describe('LandingPageHeader', () => {
	it('should render a header component with a logo and a sign-up button', () => {
		render(
			<LandingPageHeader onLogoClick={vi.fn()} onButtonClick={vi.fn()} />,
		);
		const header = screen.getByTestId('landing-page-header');
		const logo = screen.getByTestId('logo-component');
		const signUpButton = screen.getByTestId('header-sign-in-button');

		expect(header).toBeInTheDocument();
		expect(logo).toBeInTheDocument();
		expect(signUpButton).toBeInTheDocument();
	});

	it('should trigger the onLogoClick function when clicking on the logo component', () => {
		const onLogoClick = vi.fn();
		render(
			<LandingPageHeader
				onLogoClick={onLogoClick}
				onButtonClick={vi.fn()}
			/>,
		);
		const logo = screen.getByTestId('logo-component');

		fireEvent.click(logo);

		expect(onLogoClick).toHaveBeenCalled();
	});

	it('should trigger the onButtonClick function when clicking on the sign-in button', () => {
		const onButtonClick = vi.fn();
		render(
			<LandingPageHeader
				onLogoClick={vi.fn()}
				onButtonClick={onButtonClick}
			/>,
		);
		const signInButton = screen.getByTestId('header-sign-in-button');

		fireEvent.click(signInButton);

		expect(onButtonClick).toHaveBeenCalled();
	});
});

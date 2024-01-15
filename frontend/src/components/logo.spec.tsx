import { render, screen } from 'tests/test-utils';

import { Logo } from '@/components/logo';

describe('Logo', () => {
	it('should render the logo image and text with default dimensions and text size', () => {
		render(<Logo />);
		const logoComponent = screen.getByTestId('logo-component');
		const logoText = screen.getByTestId('logo-text');

		expect(logoComponent).toBeInTheDocument();
		expect(logoText).toBeInTheDocument();
	});

	it('should render the logo image and text with custom dimensions and text size', () => {
		render(<Logo textSize="text-lg" />);
		const logoComponent = screen.getByTestId('logo-component');
		const logoText = screen.getByTestId('logo-text');

		expect(logoComponent).toBeInTheDocument();
		expect(logoText).toBeInTheDocument();
		expect(logoText).toHaveClass('text-lg');
	});
});

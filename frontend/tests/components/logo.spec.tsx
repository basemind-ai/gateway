import { fireEvent, render, screen } from 'tests/test-utils';

import { Logo } from '@/components/logo';

describe('Logo', () => {
	it('should render the logo image and text with default dimensions and text size', () => {
		render(<Logo />);
		const logoComponent = screen.getByTestId('logo-component');
		const logoImage = screen.getByTestId('logo-image');
		const logoText = screen.getByTestId('logo-text');

		expect(logoComponent).toBeInTheDocument();
		expect(logoImage).toBeInTheDocument();
		expect(logoText).toBeInTheDocument();
	});

	it('should render the logo image and text with custom dimensions and text size', () => {
		render(<Logo width={100} height={100} textSize="text-lg" />);
		const logoComponent = screen.getByTestId('logo-component');
		const logoImage = screen.getByTestId('logo-image');
		const logoText = screen.getByTestId('logo-text');

		expect(logoComponent).toBeInTheDocument();
		expect(logoImage).toBeInTheDocument();
		expect(logoText).toBeInTheDocument();
	});

	it('should render the logo image and text with onClick function', () => {
		const handleClick = vi.fn();
		render(<Logo onClick={handleClick} />);
		const logoComponent = screen.getByTestId('logo-component');
		const logoImage = screen.getByTestId('logo-image');
		const logoText = screen.getByTestId('logo-text');

		expect(logoComponent).toBeInTheDocument();
		expect(logoImage).toBeInTheDocument();
		expect(logoText).toBeInTheDocument();

		fireEvent.click(logoComponent);
		expect(handleClick).toHaveBeenCalled();
	});

	it('should render the logo image and text with very small dimensions', () => {
		render(<Logo width={1} height={1} />);
		const logoComponent = screen.getByTestId('logo-component');
		const logoImage = screen.getByTestId('logo-image');
		const logoText = screen.getByTestId('logo-text');

		expect(logoComponent).toBeInTheDocument();
		expect(logoImage).toBeInTheDocument();
		expect(logoText).toBeInTheDocument();
	});

	it('should render the logo image and text with very large dimensions', () => {
		render(<Logo width={1000} height={1000} />);
		const logoComponent = screen.getByTestId('logo-component');
		const logoImage = screen.getByTestId('logo-image');
		const logoText = screen.getByTestId('logo-text');

		expect(logoComponent).toBeInTheDocument();
		expect(logoImage).toBeInTheDocument();
		expect(logoText).toBeInTheDocument();
	});

	it('should render the logo image and text with invalid dimensions', () => {
		render(<Logo width={-100} height={-100} />);
		const logoComponent = screen.getByTestId('logo-component');
		const logoImage = screen.getByTestId('logo-image');
		const logoText = screen.getByTestId('logo-text');

		expect(logoComponent).toBeInTheDocument();
		expect(logoImage).toBeInTheDocument();
		expect(logoText).toBeInTheDocument();
	});
});

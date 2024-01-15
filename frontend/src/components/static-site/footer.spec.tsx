import { render, screen } from 'tests/test-utils';

import { Footer, FooterLinks } from '@/components/static-site/footer';

describe('Footer Tests', () => {
	it('should render footer with logo', () => {
		render(<Footer />);

		const footerElement = screen.getByTestId('static-site-footer');
		expect(footerElement).toBeInTheDocument();
		const logoElement = screen.getByTestId('logo-component');
		expect(logoElement).toBeInTheDocument();
	});
	it('should render footer with links', () => {
		render(<Footer />);
		FooterLinks.forEach(({ title, href }) => {
			const linkElement = screen.getByTestId(`footer-${title}`);
			expect(linkElement).toBeInTheDocument();
			expect(linkElement).toHaveAttribute('href', href);
		});
	});
	it('should render footer with auction icons', () => {
		render(<Footer />);
		const auctionIcons = screen.getByTestId('nav-auction-icons');
		expect(auctionIcons).toBeInTheDocument();
	});
});

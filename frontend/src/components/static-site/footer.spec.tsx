import { fireEvent } from '@testing-library/react';
import { routerPushMock } from 'tests/mocks';
import { render, screen } from 'tests/test-utils';

import {
	Footer,
	GeneralFooterLinks,
	LegalFooterLinks,
} from '@/components/static-site/footer';

describe('Footer', () => {
	it('should render a footer copyright', () => {
		render(<Footer />);

		const footerElement = screen.getByTestId('static-site-footer');
		expect(footerElement).toBeInTheDocument();
		const footerCopyrightElement = screen.getByTestId('footer-copyright');
		expect(footerCopyrightElement).toBeInTheDocument();
	});
	it('should render legal links', () => {
		render(<Footer />);

		LegalFooterLinks.forEach(({ href, title }) => {
			const linkElement = screen.getByTestId(`footer-${title}`);
			expect(linkElement).toBeInTheDocument();
			fireEvent.click(linkElement);
			expect(routerPushMock).toHaveBeenCalledWith(href, href, {
				locale: 'en',
				scroll: true,
				shallow: undefined,
			});
		});
	});
	it('should render general links', () => {
		render(<Footer />);
		GeneralFooterLinks.forEach(({ href, title }) => {
			const linkElement = screen.getByTestId(`footer-${title}`);
			expect(linkElement).toBeInTheDocument();
			fireEvent.click(linkElement);
			expect(routerPushMock).toHaveBeenCalledWith(href, href, {
				locale: 'en',
				scroll: true,
				shallow: undefined,
			});
		});
	});

	it('should render social', () => {
		render(<Footer />);

		const socialElement = screen.getByTestId('footer-social');
		expect(socialElement).toBeInTheDocument();

		const discordBtnElement = screen.getByTestId('discord-btn');
		expect(discordBtnElement).toBeInTheDocument();
		fireEvent.click(discordBtnElement);

		expect(routerPushMock).toHaveBeenCalledWith(
			process.env.NEXT_PUBLIC_DISCORD_INVITE_URL,
		);
	});
});

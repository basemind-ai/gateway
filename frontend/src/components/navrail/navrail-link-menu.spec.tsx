import { render, screen } from 'tests/test-utils';

import {
	NavrailLinkMenu,
	NavrailLinkMenuProps,
} from '@/components/navrail/navrail-link-menu';

describe('NavrailLinkMenu tests', () => {
	const props: NavrailLinkMenuProps = {
		badge: <h1>Badge</h1>,
		children: <h1>Child</h1>,
		href: 'http://example.com/',
		icon: <h1>Icon</h1>,
		isCurrent: true,
		text: 'Navigation',
	};

	it('renders LinkMenu correctly', () => {
		render(<NavrailLinkMenu {...props} />);

		const text = screen.getByText(props.text!);
		expect(text).toBeInTheDocument();

		const icon = screen.getByText('Icon');
		expect(icon).toBeInTheDocument();

		const badge = screen.getByText('Badge');
		expect(badge).toBeInTheDocument();

		const child = screen.getByText('Child');
		expect(child).toBeInTheDocument();

		const link = screen.getByTestId<HTMLAnchorElement>('link-menu-anchor');
		expect(link.href).toBe(props.href);
	});
});

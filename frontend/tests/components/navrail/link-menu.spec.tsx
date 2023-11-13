import { render, screen } from 'tests/test-utils';

import LinkMenu, { LinkMenuProps } from '@/components/navrail/link-menu';

describe('LinkMenu tests', () => {
	const props: LinkMenuProps = {
		text: 'Navigation',
		icon: <h1>Icon</h1>,
		badge: <h1>Badge</h1>,
		isCurrent: true,
		href: 'http://example.com/',
		children: <h1>Child</h1>,
	};

	it('renders LinkMenu correctly', () => {
		render(<LinkMenu {...props} />);

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

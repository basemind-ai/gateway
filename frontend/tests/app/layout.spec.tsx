import { render, screen } from 'tests/test-utils';

import RootLayout from '@/app/layout';

vi.mock('next/font/google', () => ({
	Inter: () => ({ className: 'Inter' }),
}));

describe('RootLayout tests', () => {
	it('renders layout', async () => {
		const component = await RootLayout(
			// @ts-expect-error
			<div>
				<span>hello</span>
			</div>,
		);
		render(component);

		const bodyElement = screen.getByRole('document');

		expect(bodyElement).toBeInTheDocument();
	});
});

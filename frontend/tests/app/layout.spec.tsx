import { render, screen } from 'tests/test-utils';

import RootLayout from '@/app/layout';

vi.mock('next/font/google', () => ({
	Inter: () => ({ className: 'Inter' }),
}));

describe('RootLayout tests', () => {
	it('renders layout', () => {
		render(
			<RootLayout>
				<div></div>
			</RootLayout>,
		);

		const bodyElement = screen.getByRole('document');

		expect(bodyElement).toBeInTheDocument();
	});
});

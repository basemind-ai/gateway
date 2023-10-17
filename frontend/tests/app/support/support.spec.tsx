import { render, screen } from 'tests/test-utils';

import Support from '@/app/support/page';

describe('Support Page Tests', () => {
	it('renders todo support page', () => {
		render(<Support />);
		const page = screen.getByText('Support is TODO');
		expect(page).toBeInTheDocument();
	});
});

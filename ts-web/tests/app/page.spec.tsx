import { render, screen } from 'tests/test-utils';

import Home from '@/app/page';

describe('Home page tests', () => {
	it('renders signup button', () => {
		render(<Home />);
		const signupButton = screen.getByTestId('sign-in-link');
		expect(signupButton).toBeInTheDocument();
	});
});

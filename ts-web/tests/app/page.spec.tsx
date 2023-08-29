import { render, screen } from 'tests/test-utils';

import Home from '@/app/page';

describe('Home page tests', () => {
	it('renders LoginContainer', () => {
		render(<Home />);

		const loginContainer = screen.getByTestId('login-container');

		expect(loginContainer).toBeInTheDocument();
	});
});

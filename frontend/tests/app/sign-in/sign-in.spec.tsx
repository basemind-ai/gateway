import { render, screen } from 'tests/test-utils';

import SignIn from '@/app/sign-in/page';

describe('Sign-in page tests', () => {
	it('renders LoginContainer', () => {
		render(<SignIn />);
		const loginContainer = screen.getByTestId('login-container');
		expect(loginContainer).toBeInTheDocument();
	});
});

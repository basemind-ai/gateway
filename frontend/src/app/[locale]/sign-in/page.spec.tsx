import { mockPage } from 'tests/mocks';
import { render, screen, waitFor } from 'tests/test-utils';

import SignIn from '@/app/[locale]/sign-in/page';

describe('Sign-in page tests', () => {
	it('renders LoginContainer', () => {
		render(<SignIn />);
		const loginContainer = screen.getByTestId('login-container');
		expect(loginContainer).toBeInTheDocument();
	});

	it('calls page tracking hook', async () => {
		render(<SignIn />);
		await waitFor(() => {
			expect(mockPage).toHaveBeenCalledWith('auth', expect.any(Object));
		});
	});
});

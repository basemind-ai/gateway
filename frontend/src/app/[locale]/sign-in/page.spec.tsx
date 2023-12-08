import { render, screen, waitFor } from 'tests/test-utils';

import SignIn from '@/app/[locale]/sign-in/page';
import { usePageTracking } from '@/hooks/use-page-tracking';

describe('Sign-in page tests', () => {
	it('renders LoginContainer', () => {
		render(<SignIn />);
		const loginContainer = screen.getByTestId('login-container');
		expect(loginContainer).toBeInTheDocument();
	});

	it('call page tracking hook', async () => {
		render(<SignIn />);
		await waitFor(() => {
			expect(usePageTracking).toHaveBeenCalledWith('auth');
		});
	});
});

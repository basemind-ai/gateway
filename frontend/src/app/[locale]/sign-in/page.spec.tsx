import { render, screen, waitFor } from 'tests/test-utils';
import { MockInstance } from 'vitest';

import SignIn from '@/app/[locale]/sign-in/page';
import * as useTrackPagePackage from '@/hooks/use-track-page';

describe('Sign-in page tests', () => {
	let useTrackPageSpy: MockInstance;

	beforeEach(() => {
		useTrackPageSpy = vi.spyOn(useTrackPagePackage, 'useTrackPage');
	});

	it('renders LoginContainer', () => {
		render(<SignIn />);
		const loginContainer = screen.getByTestId('login-container');
		expect(loginContainer).toBeInTheDocument();
	});

	it('calls page tracking hook', async () => {
		render(<SignIn />);
		await waitFor(() => {
			expect(useTrackPageSpy).toHaveBeenCalledWith('auth');
		});
	});
});

import { render, screen } from 'tests/test-utils';

import { LoginContainer } from '@/app/sign-in/login-container';

describe('LoginContainer tests', () => {
	it('renders Firebase login and LoginBanner', () => {
		render(<LoginContainer />);

		const firebaseLogin = screen.getByTestId('firebase-login-container');
		const loginBanner = screen.getByTestId('login-banner-container');

		expect(firebaseLogin).toBeInTheDocument();
		expect(loginBanner).toBeInTheDocument();
	});
});

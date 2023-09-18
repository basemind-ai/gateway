import authTranslation from 'public/locales/en/signin-firebase.json';
import { render, routerReplaceMock, screen, waitFor } from 'tests/test-utils';
import { Mock, vi } from 'vitest';

import { FirebaseLogin } from '@/app/sign-in/firebase-login';
import { getFirebaseAuth } from '@/utils/firebase';

vi.mock('@/utils/firebase');

describe('FirebaseLogin tests', () => {
	it('renders Loader', () => {
		(getFirebaseAuth as Mock).mockImplementationOnce(() => {
			return {
				currentUser: { displayName: 'test' },
			};
		});
		render(<FirebaseLogin />);

		const loader = screen.getByTestId('firebase-login-loader');

		expect(loader).toBeInTheDocument();
	});

	it('redirects to dashboard when user is already logged in', async () => {
		(getFirebaseAuth as Mock).mockImplementationOnce(() => {
			return {
				currentUser: { displayName: 'test' },
			};
		});

		render(<FirebaseLogin />);

		await waitFor(() => {
			expect(routerReplaceMock).toHaveBeenCalledWith('/dashboard');
		});
	});

	it.skip('renders custom ui after firebase ui loads and hides loader', async () => {
		(getFirebaseAuth as Mock).mockImplementationOnce(() => {
			return {
				currentUser: null,
			};
		});

		const authGetInstanceMock = vi.fn(
			(element: string | Element, config: firebaseui.auth.Config) => {
				expect(element).toBe('#firebaseui-auth-container');

				if (config.callbacks?.uiShown) {
					config.callbacks.uiShown();
				}
			},
		);
		vi.doMock('firebaseui', () => ({
			auth: {
				AuthUI: {
					getInstance: () => ({ start: authGetInstanceMock }),
				},
			},
		}));

		render(<FirebaseLogin />);

		await waitFor(() => {
			expect(authGetInstanceMock).toHaveBeenCalled();
		});

		const greetingContainer = screen.getByTestId(
			'firebase-login-greeting-container',
		);
		expect(greetingContainer).not.toHaveClass('hidden');

		const loader = screen.queryByTestId('firebase-login-loader');
		expect(loader).not.toBeInTheDocument();

		const authHeader = screen.getByText(authTranslation.authHeader);
		const authSubtitle = screen.getByText(authTranslation.authSubtitle);
		const authSubtitleLarger = screen.getByText(
			authTranslation.authSubtitleLarger,
		);

		expect(authHeader).toBeInTheDocument();
		expect(authSubtitle).toBeInTheDocument();
		expect(authSubtitleLarger).toBeInTheDocument();
	});

	it('redirects to dashboard after user is logged in', async () => {
		(getFirebaseAuth as Mock).mockImplementationOnce(() => {
			return {
				currentUser: null,
			};
		});

		const authGetInstanceMock = vi.fn(
			(_: string | Element, config: firebaseui.auth.Config) => {
				if (config.callbacks?.signInSuccessWithAuthResult) {
					config.callbacks.signInSuccessWithAuthResult(true);
				}
			},
		);
		vi.doMock('firebaseui', () => ({
			auth: {
				AuthUI: {
					getInstance: () => ({ start: authGetInstanceMock }),
				},
			},
		}));

		render(<FirebaseLogin />);

		await waitFor(() => {
			expect(authGetInstanceMock).toHaveBeenCalled();
		});

		const greetingContainer = screen.queryByTestId(
			'firebase-login-greeting-container',
		);
		expect(greetingContainer).not.toBeInTheDocument();

		const loader = screen.queryByTestId('firebase-login-loader');
		expect(loader).toBeInTheDocument();

		expect(routerReplaceMock).toHaveBeenCalledWith('/dashboard');
	});
});

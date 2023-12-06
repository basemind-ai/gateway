import locales from 'public/messages/en.json';
import { render, routerReplaceMock, screen, waitFor } from 'tests/test-utils';
import { Mock } from 'vitest';

import { FirebaseLogin } from '@/components/sign-in/firebase-login';
import { Navigation } from '@/constants';
import { getFirebaseAuth } from '@/utils/firebase';

const signinLocales = locales.signin;

vi.mock('@/utils/firebase');

describe('FirebaseLogin tests', () => {
	it('renders Loader', async () => {
		(getFirebaseAuth as Mock).mockImplementationOnce(() => {
			return {
				currentUser: { displayName: 'test' },
			};
		});
		render(<FirebaseLogin />);

		await waitFor(() => {
			const loader = screen.getByTestId('loader-anim');
			expect(loader).toBeInTheDocument();
		});
	});

	it('redirects to dashboard when user is already logged in', async () => {
		(getFirebaseAuth as Mock).mockImplementationOnce(() => {
			return {
				currentUser: { displayName: 'test' },
			};
		});

		render(<FirebaseLogin />);

		await waitFor(() => {
			expect(routerReplaceMock).toHaveBeenCalledWith(Navigation.Projects);
		});
	});

	it('renders custom ui after firebase ui loads and hides loader', async () => {
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

		const loader = screen.queryByTestId('loader-anim');
		expect(loader).not.toBeInTheDocument();

		const authHeader = screen.getByText(signinLocales.authHeader);
		const authSubtitle = screen.getByText(signinLocales.authSubtitle);

		expect(authHeader).toBeInTheDocument();
		expect(authSubtitle).toBeInTheDocument();
	});

	it('redirects to projects after user is logged in', async () => {
		(getFirebaseAuth as Mock).mockImplementationOnce(() => {
			return {
				currentUser: null,
			};
		});

		const authGetInstanceMock = vi.fn(
			(_: string | Element, config: firebaseui.auth.Config) => {
				try {
					if (config.callbacks?.signInSuccessWithAuthResult) {
						config.callbacks.signInSuccessWithAuthResult(true);
					}
				} catch {
					return;
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

		const loader = screen.queryByTestId('loader-anim');
		expect(loader).toBeInTheDocument();

		expect(routerReplaceMock).toHaveBeenCalledWith(Navigation.Projects);
	});

	it('should add m-8 class', async () => {
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

		const addClassMock = vi.fn();
		const mockElement = { classList: { add: addClassMock } };

		vi.spyOn(document, 'querySelector').mockReturnValue(mockElement as any);

		render(<FirebaseLogin />);

		await waitFor(() => {
			expect(addClassMock).toHaveBeenCalledWith('m-8');
		});
	});
});

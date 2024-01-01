import {
	EmailAuthProvider,
	GithubAuthProvider,
	GoogleAuthProvider,
	OAuthProvider,
	signInWithPopup,
} from '@firebase/auth';
import { UserFactory } from 'tests/factories';
import { mockIdentify, mockTrack, routerReplaceMock } from 'tests/mocks';
import { fireEvent, render, screen, waitFor } from 'tests/test-utils';
import { expect, MockInstance } from 'vitest';

import { FirebaseLogin } from '@/components/sign-in/firebase-login';
import { Navigation } from '@/constants';
import { getEnv } from '@/utils/env';
import { getFirebaseAuth } from '@/utils/firebase';

vi.mock('@/utils/firebase');
vi.mock('@firebase/auth');

const mockGetAuth = (
	getFirebaseAuth as unknown as MockInstance
).mockResolvedValue({
	currentUser: null,
});
const mockSignInWithPopup = signInWithPopup as unknown as MockInstance;

describe('FirebaseLogin tests', () => {
	beforeEach(() => {
		mockSignInWithPopup.mockReset();
	});

	it('renders correctly', async () => {
		render(<FirebaseLogin setLoading={vi.fn()} isInitialized={false} />);

		await waitFor(() => {
			expect(
				screen.getByTestId('firebase-login-container'),
			).toBeInTheDocument();
		});

		expect(screen.getByTestId('email-login-button')).toBeInTheDocument();
		expect(screen.getByTestId('github-login-button')).toBeInTheDocument();
		expect(screen.getByTestId('google-login-button')).toBeInTheDocument();
		expect(
			screen.getByTestId('microsoft-login-button'),
		).toBeInTheDocument();
		expect(
			screen.getByTestId('tos-and-privacy-policy-container'),
		).toBeInTheDocument();
		expect(screen.getByTestId('tos-link')).toBeInTheDocument();
		expect(screen.getByTestId('privacy-policy-link')).toBeInTheDocument();
	});

	it('redirects to dashboard when user is already logged in', async () => {
		mockGetAuth.mockResolvedValueOnce({
			currentUser: UserFactory.buildSync(),
		});

		render(<FirebaseLogin setLoading={vi.fn()} isInitialized={true} />);

		await waitFor(() => {
			expect(routerReplaceMock).toHaveBeenCalledWith(Navigation.Projects);
		});

		expect(mockTrack).toHaveBeenCalled();
		expect(mockIdentify).toHaveBeenCalled();
	});

	it.each([
		['email-login-button', EmailAuthProvider],
		['github-login-button', GithubAuthProvider],
		['google-login-button', GoogleAuthProvider],
		['microsoft-login-button', OAuthProvider],
	])(
		`calls signInWithPopup with %s and redirects the user correctly on success`,
		async (buttonTestId, provider) => {
			mockSignInWithPopup.mockResolvedValueOnce({
				user: UserFactory.buildSync(),
			});

			render(<FirebaseLogin setLoading={vi.fn()} isInitialized={true} />);

			let button: HTMLButtonElement;

			await waitFor(() => {
				button = screen.getByTestId(buttonTestId);
				expect(button).toBeInTheDocument();
			});

			fireEvent.click(button!);

			await waitFor(() => {
				expect(mockSignInWithPopup).toHaveBeenCalledWith(
					{ currentUser: null },
					expect.any(provider),
				);
			});

			await waitFor(() => {
				expect(routerReplaceMock).toHaveBeenCalledWith(
					Navigation.Projects,
				);
			});

			expect(mockTrack).toHaveBeenCalled();
			expect(mockIdentify).toHaveBeenCalled();
		},
	);

	it('should an error toast on error', async () => {
		mockSignInWithPopup.mockRejectedValueOnce({
			message: 'failed',
		});

		render(<FirebaseLogin setLoading={vi.fn()} isInitialized={true} />);

		let button: HTMLButtonElement;

		await waitFor(() => {
			button = screen.getByTestId('email-login-button');
			expect(button).toBeInTheDocument();
		});

		fireEvent.click(button!);

		await waitFor(() => {
			const toastMessage = screen.getByTestId('toast-message');
			expect(toastMessage).toHaveTextContent('failed');
		});
	});

	it('should have the correct tos link', () => {
		render(<FirebaseLogin setLoading={vi.fn()} isInitialized={true} />);
		const tosLink: HTMLAnchorElement = screen.getByTestId('tos-link');
		expect(tosLink.href).toBe(
			getEnv().NEXT_PUBLIC_FRONTEND_HOST + Navigation.TOS,
		);
	});

	it('should have the correct privacy policy link', () => {
		render(<FirebaseLogin setLoading={vi.fn()} isInitialized={true} />);
		const privacyPolicyLink: HTMLAnchorElement = screen.getByTestId(
			'privacy-policy-link',
		);
		expect(privacyPolicyLink.href).toBe(
			getEnv().NEXT_PUBLIC_FRONTEND_HOST + Navigation.PrivacyPolicy,
		);
	});
});

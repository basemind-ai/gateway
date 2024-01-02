import { FirebaseError } from '@firebase/app';
import {
	EmailAuthProvider,
	GithubAuthProvider,
	GoogleAuthProvider,
	sendPasswordResetEmail,
	signInWithPopup,
} from '@firebase/auth';
import { UserFactory } from 'tests/factories';
import { mockIdentify, mockTrack, routerReplaceMock } from 'tests/mocks';
import {
	fireEvent,
	getLocaleNamespace,
	render,
	screen,
	waitFor,
} from 'tests/test-utils';
import { expect, MockInstance } from 'vitest';

import { FirebaseLogin } from '@/components/sign-in/firebase-login';
import { Navigation } from '@/constants';
import { useResetState } from '@/stores/toast-store';
import { getEnv } from '@/utils/env';
import { getFirebaseAuth } from '@/utils/firebase';

vi.mock('@/utils/firebase');
vi.mock('@firebase/auth');

const mockGetAuth = (
	getFirebaseAuth as unknown as MockInstance
).mockResolvedValue({
	currentUser: null,
});

const mockSendPasswordResetEmail = (
	sendPasswordResetEmail as unknown as MockInstance
).mockResolvedValue(undefined);
const mockSignInWithPopup = signInWithPopup as unknown as MockInstance;

describe('FirebaseLogin tests', () => {
	const locales = getLocaleNamespace('signin');

	const resetState = useResetState();

	beforeEach(() => {
		resetState();
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
			const toastMessage = screen.getByTestId('toast-message-error');
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

	it('should open the reset password modal when the reset password button is clicked', () => {
		render(<FirebaseLogin setLoading={vi.fn()} isInitialized={true} />);
		const resetPasswordButton: HTMLButtonElement = screen.getByTestId(
			'reset-password-button',
		);
		fireEvent.click(resetPasswordButton);
		expect(screen.getByTestId('password-reset-modal')).toBeInTheDocument();
	});

	it('should reset a user password when the reset password button is clicked', async () => {
		render(<FirebaseLogin setLoading={vi.fn()} isInitialized={true} />);
		const resetPasswordButton: HTMLButtonElement = screen.getByTestId(
			'reset-password-button',
		);
		fireEvent.click(resetPasswordButton);

		let emailInput: HTMLInputElement;
		await waitFor(() => {
			emailInput = screen.getByTestId('password-reset-input');
		});

		fireEvent.change(emailInput!, {
			target: { value: 'moishe@zuchmir.com' },
		});

		const resetPasswordSubmitButton: HTMLButtonElement = screen.getByTestId(
			'password-reset-submit-button',
		);
		fireEvent.click(resetPasswordSubmitButton);

		expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
			{ currentUser: null },
			'moishe@zuchmir.com',
		);

		expect(screen.getByTestId('toast-message-success')).toHaveTextContent(
			locales.passwordResetEmailSent,
		);
	});

	it('should show an error toast when password reset email sending fails', () => {
		mockSendPasswordResetEmail.mockRejectedValueOnce({
			message: 'failed',
		});

		render(<FirebaseLogin setLoading={vi.fn()} isInitialized={true} />);
		const resetPasswordButton: HTMLButtonElement = screen.getByTestId(
			'reset-password-button',
		);
		fireEvent.click(resetPasswordButton);
		const emailInput: HTMLInputElement = screen.getByTestId(
			'password-reset-input',
		);
		fireEvent.change(emailInput, {
			target: { value: 'moishe@zuchmir.com' },
		});
		const resetPasswordSubmitButton: HTMLButtonElement = screen.getByTestId(
			'password-reset-submit-button',
		);
		fireEvent.click(resetPasswordSubmitButton);
		expect(screen.getByTestId('toast-message-error')).toHaveTextContent(
			'failed',
		);
	});

	it("should show the correct error message for the firebase 'auth/user-not-found' code", () => {
		mockSendPasswordResetEmail.mockRejectedValueOnce(
			new FirebaseError('auth/user-not-found', 'failed'),
		);
		render(<FirebaseLogin setLoading={vi.fn()} isInitialized={true} />);
		const resetPasswordButton: HTMLButtonElement = screen.getByTestId(
			'reset-password-button',
		);
		fireEvent.click(resetPasswordButton);
		const emailInput: HTMLInputElement = screen.getByTestId(
			'password-reset-input',
		);
		fireEvent.change(emailInput, {
			target: { value: 'moishe@zuchmir.com' },
		});
		const resetPasswordSubmitButton: HTMLButtonElement = screen.getByTestId(
			'password-reset-submit-button',
		);
		fireEvent.click(resetPasswordSubmitButton);
		expect(screen.getByTestId('toast-message-error')).toHaveTextContent(
			locales.unknownEmail,
		);
	});

	it("should show the correct error message for the firebase 'auth/account-exists-with-different-credential' code", () => {
		mockSendPasswordResetEmail.mockImplementationOnce(() => {
			throw new FirebaseError(
				'auth/account-exists-with-different-credential',
				'failed',
			);
		});
		render(<FirebaseLogin setLoading={vi.fn()} isInitialized={true} />);
		const resetPasswordButton: HTMLButtonElement = screen.getByTestId(
			'reset-password-button',
		);
		fireEvent.click(resetPasswordButton);
		const emailInput: HTMLInputElement = screen.getByTestId(
			'password-reset-input',
		);
		fireEvent.change(emailInput, {
			target: { value: 'moishe@zuchmir.com' },
		});
		const resetPasswordSubmitButton: HTMLButtonElement = screen.getByTestId(
			'password-reset-submit-button',
		);
		fireEvent.click(resetPasswordSubmitButton);
		expect(screen.getByTestId('toast-message-error')).toHaveTextContent(
			locales.accountExists,
		);
	});
});

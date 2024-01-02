import { FirebaseError } from '@firebase/app';
import {
	Auth,
	AuthProvider,
	EmailAuthProvider,
	GithubAuthProvider,
	GoogleAuthProvider,
	sendEmailVerification,
	sendPasswordResetEmail,
	signInWithPopup,
	User,
} from '@firebase/auth';
import { useClickAway } from '@uidotdev/usehooks';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LegacyRef, useEffect, useState } from 'react';

import { Modal } from '@/components/modal';
import { PasswordResetModal } from '@/components/sign-in/password-reset-modal';
import { Dimensions, Navigation } from '@/constants';
import { useAnalytics } from '@/hooks/use-analytics';
import { useSetUser } from '@/stores/api-store';
import { useShowError, useShowSuccess } from '@/stores/toast-store';
import { getEnv } from '@/utils/env';
import { getFirebaseAuth } from '@/utils/firebase';

const host = getEnv().NEXT_PUBLIC_FRONTEND_HOST;

export function FirebaseLogin({
	setLoading,
	isInitialized,
}: {
	isInitialized: boolean;
	setLoading: (value: boolean) => void;
}) {
	const t = useTranslations('signin');

	const router = useRouter();
	const setUser = useSetUser();
	const showError = useShowError();
	const showSuccess = useShowSuccess();
	const { identify, track } = useAnalytics();

	const [auth, setAuth] = useState<Auth | null>(null);
	const [resetPWModalOpen, setResetPWModalOpen] = useState(false);

	const ref = useClickAway(() => {
		setResetPWModalOpen(false);
	});

	useEffect(() => {
		if (isInitialized) {
			(async () => {
				setLoading(true);

				const auth = await getFirebaseAuth();
				setAuth(auth);

				if (auth.currentUser) {
					setUser(auth.currentUser);

					identify(auth.currentUser.uid, auth.currentUser);
					track('login');

					router.replace(Navigation.Projects);
					return;
				}

				setLoading(false);
			})();
		}
	}, [isInitialized]);

	const handleLogin = async (
		provider: AuthProvider,
		cb?: (user: User) => Promise<void>,
	) => {
		setLoading(true);
		try {
			const { user } = await signInWithPopup(auth!, provider);
			setUser(user);

			if (cb) {
				await cb(user);
			}

			identify(user.uid, user);
			track('login');

			router.replace(Navigation.Projects);
		} catch (error) {
			setLoading(false);
			showError((error as Error).message);
		}
	};

	const handleResetPassword = async (email: string) => {
		try {
			await sendPasswordResetEmail(auth!, email);
			showSuccess(t('passwordResetEmailSent'));
		} catch (error) {
			if ((error as FirebaseError).code === 'auth/user-not-found') {
				showError(t('unknownEmail'));
			} else {
				showError((error as Error).message);
			}
		} finally {
			setResetPWModalOpen(false);
		}
	};

	const authProviders: {
		key: string;
		provider: AuthProvider;
		size: Dimensions;
	}[] = [
		{
			key: 'Google',
			provider: new GoogleAuthProvider(),
			size: Dimensions.Eight,
		},
		{
			key: 'GitHub',
			provider: new GithubAuthProvider(),
			size: Dimensions.Eight,
		},
	];

	const emailProvider = new EmailAuthProvider();

	return (
		<div
			data-testid="firebase-login-container"
			className="flex items-center h-full w-full justify-center"
		>
			<div className="flex flex-col justify-center gap-3 h-fit border-2 rounded border-neutral p-12">
				<button
					data-testid="email-login-button"
					className="btn btn-rounded flex border-2 border-base-300 justify-center gap-2"
					onClick={() => {
						void handleLogin(emailProvider, sendEmailVerification);
					}}
				>
					<Image
						src="/images/email-logo.svg"
						alt="Email logo"
						height={Dimensions.Seven}
						width={Dimensions.Seven}
					/>
					<span className="font-bold">Login with Email</span>
				</button>
				<div className="flex justify-end">
					<button
						className="btn btn-xs btn-link"
						onClick={() => {
							setResetPWModalOpen(true);
						}}
					>
						{t('forgotPassword')}
					</button>
				</div>
				<div className="card-section-divider" />
				{authProviders.map(({ key, provider, size }) => (
					<button
						key={key.toLowerCase()}
						data-testid={`${key.toLowerCase()}-login-button`}
						className="btn btn-rounded flex border-2 border-base-300 justify-center gap-2"
						onClick={() => {
							void handleLogin(provider);
						}}
					>
						<Image
							src={`/images/${key.toLowerCase()}-logo.svg`}
							alt={`${key} logo`}
							height={size}
							width={size}
						/>
						<span className="font-bold">{`Login with ${key}`}</span>
					</button>
				))}
				<div className="card-section-divider" />

				<div
					data-testid="tos-and-privacy-policy-container"
					className="text-xs text-center"
				>
					<span>{`${t('userAgreementMessage')} `}</span>
					<a
						className="link link-primary"
						href={host + Navigation.TOS}
						data-testid="tos-link"
					>
						{t('tos')}
					</a>
					<span>{` ${t('and')} `}</span>
					<a
						className="link link-primary"
						href={host + Navigation.PrivacyPolicy}
						data-testid="privacy-policy-link"
					>
						{t('privacyPolicy')}
					</a>
					<span>.</span>
				</div>
				<div ref={ref as LegacyRef<HTMLDivElement>}>
					<Modal
						modalOpen={resetPWModalOpen}
						dataTestId="reset-password-modal"
						onClose={() => {
							setResetPWModalOpen(false);
						}}
					>
						<PasswordResetModal
							handleCloseModal={() => {
								setResetPWModalOpen(false);
							}}
							handleResetPassword={handleResetPassword}
						/>
					</Modal>
				</div>
			</div>
		</div>
	);
}

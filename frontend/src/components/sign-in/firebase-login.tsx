import { FirebaseError } from '@firebase/app';
import {
	Auth,
	AuthProvider,
	GithubAuthProvider,
	GoogleAuthProvider,
	sendPasswordResetEmail,
	signInWithPopup,
	User,
} from '@firebase/auth';
import { useClickAway } from '@uidotdev/usehooks';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LegacyRef, useEffect, useState } from 'react';

import { Modal } from '@/components/modal';
import { PasswordResetModal } from '@/components/sign-in/password-reset-modal';
import { Dimensions, Navigation } from '@/constants';
import { TrackEvents } from '@/constants/analytics';
import { useAnalytics } from '@/hooks/use-analytics';
import { useSetUser } from '@/stores/api-store';
import { useShowError, useShowSuccess } from '@/stores/toast-store';
import { getEnv } from '@/utils/env';
import { getFirebaseAuth } from '@/utils/firebase';

const host = getEnv().NEXT_PUBLIC_FRONTEND_HOST;

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
					identify(auth.currentUser.uid, auth.currentUser);
					track(TrackEvents.SignedIn, {
						providerId: auth.currentUser.providerId,
					});
					setUser(auth.currentUser);
					return;
				}

				setLoading(false);
			})();
		}
	}, [isInitialized, track, identify, router, setLoading, setUser]);

	const handleLogin = async (
		provider: AuthProvider,
		cb?: (user: User) => Promise<void>,
	) => {
		setLoading(true);
		try {
			const { user } = await signInWithPopup(auth!, provider);
			identify(user.uid, {
				avatar: user.photoURL,
				email: user.email,
				id: user.uid,
				name: user.displayName,
			});
			track(TrackEvents.SignedUp, { providerId: user.providerId });
			setUser(user);
			if (cb) {
				await cb(user);
			}

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

	return (
		<div
			data-testid="firebase-login-container"
			className="flex items-center h-full w-full justify-center"
		>
			<div className="flex flex-col justify-center gap-3 h-fit border-1 rounded border-neutral p-12">
				<h3 className="text-4xl font-bold text-center text-neutral-content">
					{t('welcomeMessage')}
				</h3>
				<p className="text-center text-neutral-content">
					{t('welcomeMessageDescription')}
				</p>
				<div className="card-section-divider" />
				{authProviders.map(({ key, provider, size }) => (
					<button
						key={key.toLowerCase()}
						data-testid={`${key.toLowerCase()}-login-button`}
						className="btn btn-bloc"
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
					className="text-xs text-center text-neutral-content max-w-xs mx-auto"
				>
					<span>{t('userAgreementMessage')}</span>
					<Link
						className="link hover:link-accent"
						href={host + Navigation.TOS}
						data-testid="tos-link"
					>
						{t('tos')}
					</Link>
					<span>{` ${t('and')} `}</span>
					<Link
						className="link hover:link-accent"
						href={host + Navigation.PrivacyPolicy}
						data-testid="privacy-policy-link"
					>
						{t('privacyPolicy')}
					</Link>
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

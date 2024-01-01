import {
	Auth,
	AuthProvider,
	EmailAuthProvider,
	GithubAuthProvider,
	GoogleAuthProvider,
	OAuthProvider,
	signInWithPopup,
} from '@firebase/auth';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { Dimensions, Navigation } from '@/constants';
import { useAnalytics } from '@/hooks/use-analytics';
import { useSetUser } from '@/stores/api-store';
import { useShowError } from '@/stores/toast-store';
import { getEnv } from '@/utils/env';
import { getFirebaseAuth } from '@/utils/firebase';

const emailProvider = new EmailAuthProvider();
const googleAuthProvider = new GoogleAuthProvider();
const githubAuthProvider = new GithubAuthProvider();
const microsoftAuthProvider = new OAuthProvider('microsoft.com');

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
	const { identify, track } = useAnalytics();

	const [auth, setAuth] = useState<Auth | null>(null);

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

	const handleLogin = async (provider: AuthProvider) => {
		setLoading(true);
		try {
			const { user } = await signInWithPopup(auth!, provider);
			setUser(user);

			identify(user.uid, user);
			track('login');

			router.replace(Navigation.Projects);
		} catch (error) {
			setLoading(false);
			showError((error as Error).message);
		}
	};

	return (
		<div
			data-testid="firebase-login-container"
			className="flex items-center h-full w-full justify-center"
		>
			<div className="flex flex-col justify-center gap-3 h-fit border-2 rounded border-neutral p-12">
				<button
					data-testid="email-login-button"
					className="btn btn-rounded btn-lg flex border-2 border-base-300 justify-center gap-2"
					onClick={() => {
						void handleLogin(emailProvider);
					}}
				>
					<Image
						src="/images/email-logo.svg"
						alt="Email logo"
						height={Dimensions.Seven}
						width={Dimensions.Seven}
					/>
					<span className="font-bold text-lg">Login with Email</span>
				</button>
				<div className="card-section-divider" />
				<button
					data-testid="github-login-button"
					className="btn btn-rounded btn-lg flex border-2 border-base-300 justify-center gap-2"
					onClick={() => {
						void handleLogin(githubAuthProvider);
					}}
				>
					<Image
						src="/images/github-logo.svg"
						alt="GitHub logo"
						height={Dimensions.Eight}
						width={Dimensions.Eight}
					/>
					<span className="font-bold text-lg">Login with GitHub</span>
				</button>
				<button
					data-testid="google-login-button"
					className="btn btn-rounded btn-lg flex border-2 border-base-300 justify-center gap-2"
					onClick={() => {
						void handleLogin(googleAuthProvider);
					}}
				>
					<Image
						src="/images/google-logo.svg"
						alt="Google logo"
						height={Dimensions.Eight}
						width={Dimensions.Eight}
					/>
					<span className="font-bold text-lg">Login with Google</span>
				</button>
				<button
					data-testid="microsoft-login-button"
					className="btn btn-rounded btn-lg flex border-2 border-base-300 justify-center gap-2"
					onClick={() => {
						void handleLogin(microsoftAuthProvider);
					}}
				>
					<Image
						src="/images/microsoft-logo.svg"
						alt="Microsoft logo"
						height={Dimensions.Seven}
						width={Dimensions.Seven}
					/>
					<span className="font-bold text-lg">
						Login with Microsoft
					</span>
				</button>
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
			</div>
		</div>
	);
}

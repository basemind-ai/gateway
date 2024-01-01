import 'firebaseui/dist/firebaseui.css';

import {
	EmailAuthProvider,
	GithubAuthProvider,
	GoogleAuthProvider,
} from '@firebase/auth';
import firebaseui from 'firebaseui';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { Navigation } from '@/constants';
import { useAnalytics } from '@/hooks/use-analytics';
import { useSetUser } from '@/stores/api-store';
import { useShowError } from '@/stores/toast-store';
import { getEnv } from '@/utils/env';
import { getFirebaseAuth } from '@/utils/firebase';

const microsoftAuthProvider = {
	buttonColor: '#00a2ed',
	customParameters: {
		prompt: 'consent',
		tenant: getEnv().NEXT_PUBLIC_FIREBASE_MICROSOFT_TENANT_ID,
	},
	iconUrl:
		'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg',
	provider: 'microsoft.com',
	providerName: 'Microsoft',
};

const siteName = 'BaseMind.AI';

const privacyPolicyUrl =
	getEnv().NEXT_PUBLIC_FRONTEND_HOST + Navigation.PrivacyPolicy;

const tosUrl = getEnv().NEXT_PUBLIC_FRONTEND_HOST + Navigation.TOS;

const firebaseUIConfig = {
	privacyPolicyUrl,
	signInOptions: [
		EmailAuthProvider.PROVIDER_ID,
		GithubAuthProvider.PROVIDER_ID,
		GoogleAuthProvider.PROVIDER_ID,
		microsoftAuthProvider,
	],
	siteName,
	tosUrl,
} satisfies firebaseui.auth.Config;

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

	const [uiRendered, setIsUIRendered] = useState(false);
	const [isSignedIn, setIsSignedIn] = useState(false);

	/* firebaseui cannot be imported in SSR mode, so we have to import it only when the browser loads. */
	useEffect(() => {
		if (isInitialized) {
			(async () => {
				setLoading(true);
				try {
					const auth = await getFirebaseAuth();

					if (auth.currentUser) {
						setUser(auth.currentUser);
						router.replace(Navigation.Projects);
						identify(auth.currentUser.uid, auth.currentUser);
						track('login');
						return null;
					}

					const firebaseUI = await import('firebaseui');

					const ui =
						firebaseUI.auth.AuthUI.getInstance() ??
						/* c8 ignore next */
						new firebaseUI.auth.AuthUI(auth);
					// noinspection JSUnusedGlobalSymbols
					ui.start('#firebaseui-auth-container', {
						...firebaseUIConfig,

						callbacks: {
							signInFailure(
								error: firebaseui.auth.AuthUIError,
							): Promise<void> | void {
								setLoading(false);
								showError(error.message);
								setIsUIRendered(false);
							},
							signInSuccessWithAuthResult: (result) => {
								console.log('authResult', result);
								setUser(auth.currentUser);
								setIsSignedIn(true);

								identify(
									auth.currentUser!.uid,
									auth.currentUser!,
								);
								track('signup');

								// prevent the UI from redirecting the user using a preconfigured redirect-url
								return false;
							},
							uiShown: () => {
								setLoading(false);
								setIsUIRendered(true);
							},
						},
					});
				} catch (e: unknown) {
					setLoading(false);
					showError((e as Error).message);
					setIsUIRendered(false);
				}
			})();
		}
	}, [isInitialized]);

	useEffect(() => {
		if (isSignedIn) {
			router.replace(Navigation.Projects);
		}
	}, [isSignedIn]);

	useEffect(() => {
		if (uiRendered) {
			document
				.querySelector('.firebaseui-card-footer')
				?.classList.add('m-8');

			document
				.querySelector('.firebaseui-tos')
				?.classList.add('text-base-content');
		}
	}, [uiRendered]);

	return (
		<div
			data-testid="firebase-login-container"
			className="flex items-center h-full w-full justify-center"
		>
			<div className="shadow transition-all duration-700 ease-in-out h-full items-center self-center">
				<div className="flex items-center h-full">
					<div id="firebaseui-auth-container">
						<div
							data-testid="firebase-login-greeting-container"
							className={`m-8 ${uiRendered ? '' : 'hidden'}`}
						>
							<h1 className="text-2xl md:text-4xl 2xl:text-5xl font-bold text-center text-base-content mb-2.5">
								{t('authHeader')}{' '}
								<span className="text-primary">
									{t('basemind')}
								</span>
							</h1>
							<p className="text-center text-base-content md:text-lg font-medium mt-3">
								<span>{t('authSubtitle')} </span>
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

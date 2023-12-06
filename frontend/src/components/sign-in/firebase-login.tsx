'use client';
import 'firebaseui/dist/firebaseui.css';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { Loader } from '@/components/sign-in/loader';
import { Navigation } from '@/constants';
import { useAnalytics } from '@/hooks/use-analytics';
import { useSetUser } from '@/stores/api-store';
import { firebaseUIConfig, getFirebaseAuth } from '@/utils/firebase';

export function FirebaseLogin() {
	const t = useTranslations('signin');

	const router = useRouter();
	const setUser = useSetUser();
	const { identify, track } = useAnalytics();

	const [uiRendered, setIsUIRendered] = useState(false);
	const [isSignedIn, setIsSignedIn] = useState(false);

	/* firebaseui cannot be imported in SSR mode, so we have to import it only when the browser loads. */
	useEffect(() => {
		(async () => {
			const auth = await getFirebaseAuth();
			if (auth.currentUser) {
				setUser(auth.currentUser);
				router.replace(Navigation.Projects);
				identify(auth.currentUser.uid, auth.currentUser);

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
					signInSuccessWithAuthResult: () => {
						setUser(auth.currentUser);
						setIsSignedIn(true);

						identify(auth.currentUser!.uid, auth.currentUser!);
						track('user sign in');

						// prevent the UI from redirecting the user using a preconfigured redirect-url
						return false;
					},
					uiShown: () => {
						setIsUIRendered(true);
					},
				},
			});
		})();
	}, []);

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

	const isLoading = !uiRendered || isSignedIn;

	return (
		<main
			data-testid="firebase-login-container"
			className="flex items-center h-full w-full justify-center"
		>
			<div className="  shadow transition-all duration-700 ease-in-out h-full items-center self-center">
				{isLoading && <Loader />}
				{!isSignedIn && (
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
				)}
			</div>
		</main>
	);
}

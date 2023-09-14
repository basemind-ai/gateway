'use client';
import 'firebaseui/dist/firebaseui.css';

import { useRouter } from 'next/navigation';
import useTranslation from 'next-translate/useTranslation';
import { useEffect, useState } from 'react';

import { useSetUser } from '@/stores/user-store';
import { firebaseUIConfig, getFirebaseAuth } from '@/utils/firebase';

export function FirebaseLogin() {
	const [uiRendered, setIsUIRendered] = useState(false);
	const [isSignedIn, setIsSignedIn] = useState(false);
	const { t } = useTranslation('signIn');

	const router = useRouter();
	const setUser = useSetUser();

	/* firebaseui cannot be imported in SSR mode, so we have to import it only when the browser loads. */
	useEffect(() => {
		(async () => {
			const auth = await getFirebaseAuth();
			if (auth.currentUser) {
				setUser(auth.currentUser);
				router.replace('/dashboard');
				return;
			}

			const firebaseUI = await import('firebaseui');
			const ui =
				firebaseUI.auth.AuthUI.getInstance() ??
				new firebaseUI.auth.AuthUI(auth);

			// noinspection JSUnusedGlobalSymbols
			ui.start('#firebaseui-auth-container', {
				...firebaseUIConfig,

				callbacks: {
					uiShown: () => {
						setIsUIRendered(true);
					},
					signInSuccessWithAuthResult: () => {
						// prevent the UI from redirecting the user using a preconfigured redirect-url
						setIsSignedIn(true);
						setUser(auth.currentUser!);
						return false;
					},
				},
			});
		})();
	}, []);

	useEffect(() => {
		if (isSignedIn) {
			router.replace('/dashboard');
		}
	}, [isSignedIn]);

	useEffect(() => {
		if (uiRendered) {
			const footer = document.querySelector('.firebaseui-card-footer');
			const tosMessage = document.querySelector('.firebaseui-tos');

			if (footer) {
				footer.classList.add('mb-16');
			}
			if (tosMessage) {
				tosMessage.classList.add('text-base-content');
			}
		}
	}, [uiRendered]);

	const loading = !uiRendered || isSignedIn;

	return (
		<main
			data-testid="firebase-login-container"
			className="bg-base-200 flex items-center h-full w-full"
		>
			<div className="mx-auto p-16 bg-base-200 border-1 rounded-box shadow transition-all duration-700 ease-in-out h-full">
				{loading && (
					<div
						data-testid="firebase-login-loader"
						className="m-10 flex justify-center items-center h-full"
					>
						<span
							className="animate-spin inline-block w-6 h-6 border-[4px] border-current border-t-transparent text-primary rounded-full"
							role="status"
							aria-label="loading"
						></span>
					</div>
				)}
				{!isSignedIn && (
					<div id="firebaseui-auth-container" className="w-112 h-102">
						<div
							data-testid="firebase-login-greeting-container"
							className={`m-10 ${uiRendered ? '' : 'hidden'}`}
						>
							<h1 className="text-2xl md:text-4xl 2xl:text-5xl font-bold text-center text-base-content mb-2">
								{t('authHeader')}
							</h1>
							<p className="text-center text-base-content mt-3">
								<span>{t('authSubtitle')} </span>
								<span className="hidden md:inline">
									{t('authSubtitleLarger')}
								</span>
							</p>
						</div>
					</div>
				)}
			</div>
		</main>
	);
}

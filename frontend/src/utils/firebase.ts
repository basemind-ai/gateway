import { GithubAuthProvider, GoogleAuthProvider } from '@firebase/auth';
import { FirebaseApp, FirebaseOptions, initializeApp } from 'firebase/app';
import { Auth, browserLocalPersistence, getAuth } from 'firebase/auth';

import { Navigation } from '@/constants';
import { ConfigurationError } from '@/errors';

const instanceRef: { app: FirebaseApp | null; auth: Auth | null } = {
	app: null,
	auth: null,
};

export function getFirebaseConfig(): FirebaseOptions {
	const firebaseConfig = {
		apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
		appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
		authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
		measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
		messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGE_SENDER_ID,
		projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
		storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
	} satisfies FirebaseOptions;

	for (const [key, value] of Object.entries(firebaseConfig)) {
		if (!value) {
			throw new ConfigurationError(
				`Missing Firebase config value for ${key}`,
			);
		}
	}

	return firebaseConfig;
}

export function getFirebaseApp(): FirebaseApp {
	if (!instanceRef.app) {
		const firebaseConfig = getFirebaseConfig();
		instanceRef.app = initializeApp(firebaseConfig);
	}

	return instanceRef.app;
}

export async function getFirebaseAuth(): Promise<Auth> {
	if (!instanceRef.auth) {
		const app = getFirebaseApp();
		const auth = getAuth(app);
		await auth.setPersistence(browserLocalPersistence);

		instanceRef.auth = auth;
	}

	return instanceRef.auth;
}
export const firebaseUIConfig = {
	popupMode: true,
	privacyPolicyUrl: Navigation.PrivacyPolicy,
	signInFlow: 'popup',
	signInOptions: [
		GithubAuthProvider.PROVIDER_ID,
		GoogleAuthProvider.PROVIDER_ID,
		{
			buttonColor: '#00a2ed',
			customParameters: {
				prompt: 'consent',
				tenant: process.env.NEXT_PUBLIC_FIREBASE_MICROSOFT_TENANT_ID,
			},
			iconUrl:
				'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg',
			provider: 'microsoft.com',
			providerName: 'Microsoft',
		},
	],
	siteName: 'BaseMind',
	tosUrl: Navigation.TOS,
};

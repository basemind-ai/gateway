import {
	EmailAuthProvider,
	GithubAuthProvider,
	GoogleAuthProvider,
} from '@firebase/auth';
import { FirebaseApp, FirebaseOptions, initializeApp } from 'firebase/app';
import { Auth, browserLocalPersistence, getAuth } from 'firebase/auth';

const instanceRef: { app: FirebaseApp | null; auth: Auth | null } = {
	app: null,
	auth: null,
};

export function getFirebaseConfig(): FirebaseOptions {
	const firebaseConfig = {
		apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
		authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
		projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
		storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
		messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGE_SENDER_ID,
		appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
		measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
	} satisfies FirebaseOptions;

	for (const [key, value] of Object.entries(firebaseConfig)) {
		if (!value) {
			throw new Error(`Missing Firebase config value for ${key}`);
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
	signInFlow: 'popup',
	popupMode: true,
	siteName: 'Devlingo',
	tosUrl: 'terms-of-service',
	// Privacy policy url.
	privacyPolicyUrl: 'privacy-policy',
	signInOptions: [
		GithubAuthProvider.PROVIDER_ID,
		GoogleAuthProvider.PROVIDER_ID,
		{
			provider: 'microsoft.com',
			providerName: 'Microsoft',
			buttonColor: '#00a2ed',
			iconUrl:
				'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg',
			customParameters: {
				prompt: 'consent',
				tenant: process.env.NEXT_PUBLIC_FIREBASE_MICROSOFT_TENANT_ID,
			},
		},
		EmailAuthProvider.PROVIDER_ID,
	],
};

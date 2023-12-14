import { FirebaseApp, FirebaseOptions, initializeApp } from 'firebase/app';
import { Auth, browserLocalPersistence, getAuth } from 'firebase/auth';

import { getEnv } from '@/utils/env';

const instanceRef: { app: FirebaseApp | null; auth: Auth | null } = {
	app: null,
	auth: null,
};

export function getFirebaseConfig(): FirebaseOptions {
	return {
		apiKey: getEnv().NEXT_PUBLIC_FIREBASE_API_KEY,
		appId: getEnv().NEXT_PUBLIC_FIREBASE_APP_ID,
		authDomain: getEnv().NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
		measurementId: getEnv().NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
		messagingSenderId: getEnv().NEXT_PUBLIC_FIREBASE_MESSAGE_SENDER_ID,
		projectId: getEnv().NEXT_PUBLIC_FIREBASE_PROJECT_ID,
		storageBucket: getEnv().NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
	} satisfies FirebaseOptions;
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

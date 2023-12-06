import { FirebaseApp, FirebaseOptions, initializeApp } from 'firebase/app';
import { Auth, browserLocalPersistence, getAuth } from 'firebase/auth';

const instanceRef: { app: FirebaseApp | null; auth: Auth | null } = {
	app: null,
	auth: null,
};

export function getFirebaseConfig(): FirebaseOptions {
	return {
		apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
		appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
		authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
		measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID!,
		messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGE_SENDER_ID!,
		projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
		storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
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

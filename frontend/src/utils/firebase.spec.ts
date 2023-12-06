import {
	getFirebaseApp,
	getFirebaseAuth,
	getFirebaseConfig,
} from '@/utils/firebase';

describe('firebase utils tests', () => {
	const originalEnv = process.env;
	afterAll(() => {
		process.env = originalEnv;
	});
	beforeEach(() => {
		process.env.NEXT_PUBLIC_FIREBASE_API_KEY = '123';
		process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test.com';
		process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'abc';
		process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test-bucket';
		process.env.NEXT_PUBLIC_FIREBASE_MESSAGE_SENDER_ID = '456';
		process.env.NEXT_PUBLIC_FIREBASE_APP_ID = 'test-app-id';
		process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID = 'test-measurement-id';
	});
	describe('getFirebaseConfig tests', () => {
		it('should return a FirebaseOptions object', () => {
			const firebaseConfig = getFirebaseConfig();
			expect(firebaseConfig).toEqual({
				apiKey: '123',
				appId: 'test-app-id',
				authDomain: 'test.com',
				measurementId: 'test-measurement-id',
				messagingSenderId: '456',
				projectId: 'abc',
				storageBucket: 'test-bucket',
			});
		});
	});
	describe('getFirebaseApp tests', () => {
		it('should return a FirebaseApp object', () => {
			const firebaseApp = getFirebaseApp();
			expect(firebaseApp).toBeTruthy();
		});
		it('should return the same FirebaseApp object', () => {
			const firebaseApp1 = getFirebaseApp();
			const firebaseApp2 = getFirebaseApp();
			expect(firebaseApp1).toBe(firebaseApp2);
		});
	});
	describe('getFirebaseAuth tests', () => {
		it('should return a Firebase AuthGuard object', async () => {
			const firebaseAuth = await getFirebaseAuth();
			expect(firebaseAuth).toBeTruthy();
		});
		it('should return the same Firebase AuthGuard object', async () => {
			const firebaseAuth1 = await getFirebaseAuth();
			const firebaseAuth2 = await getFirebaseAuth();
			expect(firebaseAuth1).toStrictEqual(firebaseAuth2);
		});
	});
});

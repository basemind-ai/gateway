import { faker } from '@faker-js/faker';
import { beforeEach } from 'vitest';

export const mockFetch = vi.fn().mockResolvedValue({
	ok: true,
	status: 200,
	json: () => Promise.resolve({}),
});

const env = {
	NEXT_PUBLIC_BACKEND_BASE_URL: 'http://www.example.com',
	NEXT_PUBLIC_FIREBASE_API_KEY: faker.string.uuid(),
	NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'devlingo-demo.firebaseapp.com',
	NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'devlingo-demo',
	NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'devlingo-demo.appspot.com',
	NEXT_PUBLIC_FIREBASE_MESSAGE_SENDER_ID: 12_345_678_910,
	NEXT_PUBLIC_FIREBASE_APP_ID: faker.string.uuid(),
	NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: faker.string.uuid(),
	NEXT_PUBLIC_FIREBASE_MICROSOFT_TENANT_ID: faker.string.uuid(),
};

const initializeAppMock = vi.fn().mockReturnValue({});
const getAuthMock = vi.fn().mockImplementation(() => ({
	setPersistence: vi.fn(),
	currentUser: {
		getIdToken: vi.fn().mockResolvedValue('test_token'),
	},
}));

vi.mock(
	'firebase/app',
	async (importOriginal: () => Promise<Record<string, any>>) => {
		const original = await importOriginal();
		return { ...original, initializeApp: initializeAppMock };
	},
);

vi.mock(
	'firebase/auth',
	async (importOriginal: () => Promise<Record<string, any>>) => {
		const original = await importOriginal();

		return {
			...original,
			getAuth: getAuthMock,
			browserLocalPersistence: vi.fn(),
		};
	},
);

beforeEach(() => {
	global.fetch = mockFetch;
	Object.assign(process.env, env);
});

export { getAuthMock, initializeAppMock };

Object.defineProperties(global.HTMLElement.prototype, {
	offsetHeight: {
		get() {
			return Number.parseFloat(this.style.height) || 1;
		},
	},
	offsetWidth: {
		get() {
			return Number.parseFloat(this.style.width) || 1;
		},
	},
});

export const routerReplaceMock = vi.fn();
export const useParamsMock = vi.fn();
export const usePathnameMock = vi.fn();

export const nextRouterMock = {
	basePath: '',
	pathname: '',
	route: '',
	query: {},
	asPath: '/',
	back: vi.fn(),
	beforePopState: vi.fn(),
	prefetch: vi.fn(),
	push: vi.fn(),
	reload: vi.fn(),
	forward: vi.fn(),
	replace: routerReplaceMock,
	events: {
		on: vi.fn(),
		off: vi.fn(),
		emit: vi.fn(),
	},
	isFallback: false,
	isLocaleDomain: false,
	isReady: true,
	defaultLocale: 'en',
	domainLocales: [],
	isPreview: false,
};

vi.mock(
	'next/navigation',
	async (importOriginal: () => Promise<Record<string, any>>) => {
		const original = await importOriginal();
		return {
			...original,
			useRouter: () => nextRouterMock,
			usePathname: usePathnameMock,
			useParams: useParamsMock,
		};
	},
);
beforeEach(() => {
	routerReplaceMock.mockReset();
});

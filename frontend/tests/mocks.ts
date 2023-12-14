import { faker } from '@faker-js/faker';
import process from 'process';
import { beforeEach } from 'vitest';

import { Env } from '@/utils/env';

// see: https://github.com/jsdom/jsdom/issues/3294
export const showModalMock = vi.fn();
export const showMock = vi.fn();
export const closeMock = vi.fn();

beforeAll(() => {
	HTMLDialogElement.prototype.show = showMock;
	HTMLDialogElement.prototype.showModal = showModalMock;
	HTMLDialogElement.prototype.close = closeMock;
});

beforeEach(() => {
	showModalMock.mockReset();
	showMock.mockReset();
	closeMock.mockReset();
});

export const mockFetch = vi.fn();

export const mockEnv = {
	NEXT_PUBLIC_BACKEND_URL: 'http://www.example.com',
	NEXT_PUBLIC_DISCORD_INVITE_URL: 'https://discord.gg/abc',
	NEXT_PUBLIC_FIREBASE_API_KEY: faker.string.uuid(),
	NEXT_PUBLIC_FIREBASE_APP_ID: faker.string.uuid(),
	NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'devlingo-demo.firebaseapp.com',
	NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: faker.string.uuid(),
	NEXT_PUBLIC_FIREBASE_MESSAGE_SENDER_ID: '12_345_678_910',
	NEXT_PUBLIC_FIREBASE_MICROSOFT_TENANT_ID: faker.string.uuid(),
	NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'devlingo-demo',
	NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'devlingo-demo.appspot.com',
	NEXT_PUBLIC_FRONTEND_HOST: 'http://localhost:3000',
	NEXT_PUBLIC_SEGMENT_WRITE_KEY: faker.string.uuid(),
} satisfies Env;

const initializeAppMock = vi.fn().mockReturnValue({});
const getAuthMock = vi.fn().mockImplementation(() => ({
	currentUser: {
		getIdToken: vi.fn().mockResolvedValue('test_token'),
	},
	setPersistence: vi.fn(),
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
			browserLocalPersistence: vi.fn(),
			getAuth: getAuthMock,
		};
	},
);

beforeEach(() => {
	mockFetch.mockReset();
	mockFetch.mockResolvedValue({
		json: () => Promise.resolve({}),
		ok: true,
		status: 200,
	});
	global.fetch = mockFetch;
	Object.assign(process.env, mockEnv);
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
export const routerPushMock = vi.fn();
export const useParamsMock = vi.fn();
export const usePathnameMock = vi.fn(() => '');

export const nextRouterMock = {
	asPath: '/',
	back: vi.fn(),
	basePath: '',
	beforePopState: vi.fn(),
	defaultLocale: 'en',
	domainLocales: [],
	events: {
		emit: vi.fn(),
		off: vi.fn(),
		on: vi.fn(),
	},
	forward: vi.fn(),
	isFallback: false,
	isLocaleDomain: false,
	isPreview: false,
	isReady: true,
	pathname: '',
	prefetch: vi.fn(),
	push: routerPushMock,
	query: {},
	reload: vi.fn(),
	replace: routerReplaceMock,
	route: '',
};

vi.mock(
	'next/navigation',
	async (importOriginal: () => Promise<Record<string, any>>) => {
		const original = await importOriginal();
		return {
			...original,
			useParams: useParamsMock,
			usePathname: usePathnameMock,
			useRouter: () => nextRouterMock,
		};
	},
);
beforeEach(() => {
	routerReplaceMock.mockReset();
});

export const mockReady = vi.fn(async () => true);
export const mockTrack = vi.fn();
export const mockIdentify = vi.fn();
export const mockPage = vi.fn();
export const mockGroup = vi.fn();
vi.mock(
	'@segment/analytics-next',
	async (importOriginal: () => Promise<Record<string, any>>) => {
		const original = await importOriginal();

		return {
			...original,
			AnalyticsBrowser: {
				load: vi.fn(() => ({
					group: mockGroup,
					identify: mockIdentify,
					page: mockPage,
					ready: mockReady,
					track: mockTrack,
				})),
			},
		};
	},
);
const originalWriteKey = process.env.NEXT_PUBLIC_SEGMENT_WRITE_KEY;

beforeEach(() => {
	process.env.NEXT_PUBLIC_SEGMENT_WRITE_KEY = 'test';
});

afterAll(() => {
	process.env.NEXT_PUBLIC_SEGMENT_WRITE_KEY = originalWriteKey;
});

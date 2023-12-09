import { UserInfo } from '@firebase/auth';
import { useTranslations } from 'next-intl';
import { getAuthMock, routerReplaceMock } from 'tests/mocks';
import { render, renderHook, screen, waitFor } from 'tests/test-utils';
import { MockInstance } from 'vitest';

import Support from '@/app/[locale]/support/page';
import { Navigation } from '@/constants';
import * as useTrackPagePackage from '@/hooks/use-track-page';
import { useSetUser } from '@/stores/api-store';

describe('Support Page Tests', () => {
	const {
		result: { current: t },
	} = renderHook(() => useTranslations('support'));
	const mockUser: UserInfo = {
		displayName: 'Skywalker',
		email: 'Skywalker@gmail.com',
		phoneNumber: '',
		photoURL: 'https://picsum.photos/200',
		providerId: '',
		uid: '',
	};

	let useTrackPageSpy: MockInstance;
	beforeEach(() => {
		useTrackPageSpy = vi
			.spyOn(useTrackPagePackage, 'useTrackPage')
			.mockImplementationOnce(() => vi.fn());
	});

	it('route to sign in page when user is not authenticate', async () => {
		// render setUser store to null
		const { result: setResult } = renderHook(() => useSetUser());
		setResult.current(null);
		getAuthMock.mockImplementationOnce(() => ({
			currentUser: null,
			setPersistence: vi.fn(),
		}));
		render(<Support />);
		await waitFor(() => {
			expect(routerReplaceMock).toHaveBeenCalledWith(Navigation.SignIn);
		});
	});

	it('calls page tracking hook', async () => {
		render(<Support />);
		await waitFor(() => {
			expect(useTrackPageSpy).toHaveBeenCalledWith('support');
		});
	});

	it('renders support page', () => {
		getAuthMock.mockImplementationOnce(() => ({
			currentUser: mockUser,
			setPersistence: vi.fn(),
		}));
		render(<Support />);
		const page = screen.getByTestId('support-page');
		expect(page).toBeInTheDocument();
	});
	it('renders headline support page', () => {
		getAuthMock.mockImplementationOnce(() => ({
			currentUser: mockUser,
			setPersistence: vi.fn(),
		}));
		render(<Support />);
		const [page] = screen.getAllByText(t('headline'));
		expect(page).toBeInTheDocument();
	});
});

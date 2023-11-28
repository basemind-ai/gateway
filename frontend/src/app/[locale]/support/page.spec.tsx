import { UserInfo } from '@firebase/auth';
import { waitFor } from '@testing-library/react';
import { useTranslations } from 'next-intl';
import { getAuthMock, routerReplaceMock } from 'tests/mocks';
import { render, renderHook, screen } from 'tests/test-utils';

import Support from '@/app/[locale]/support/page';
import { Navigation } from '@/constants';
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

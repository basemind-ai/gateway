import { UserInfo } from '@firebase/auth';
import { screen } from '@testing-library/react';
import { useTranslations } from 'next-intl';
import { getAuthMock, routerReplaceMock } from 'tests/mocks';
import { render, renderHook, waitFor } from 'tests/test-utils';

import UserSettings from '@/app/settings/page';
import { Navigation } from '@/constants';

describe('user settings page tests', () => {
	const {
		result: { current: t },
	} = renderHook(() => useTranslations('userSettings'));
	const mockUser: UserInfo = {
		phoneNumber: '',
		providerId: '',
		uid: '',
		displayName: 'Skywalker',
		email: 'Skywalker@gmail.com',
		photoURL: 'https://picsum.photos/200',
	};
	beforeEach(() => {
		getAuthMock.mockImplementation(() => ({
			setPersistence: vi.fn(),
			currentUser: mockUser,
		}));
	});

	afterEach(() => {
		getAuthMock.mockReset();
	});

	it('should route to sign in page when user is not present', async () => {
		getAuthMock.mockImplementationOnce(() => ({
			setPersistence: vi.fn(),
			currentUser: null,
		}));
		render(<UserSettings />);
		await waitFor(() => {
			expect(routerReplaceMock).toHaveBeenCalledWith(Navigation.SignIn);
		});
	});

	it('should render headline', () => {
		render(<UserSettings />);
		const headline = screen.getByText(t('headline'));
		expect(headline).toBeInTheDocument();
	});
});
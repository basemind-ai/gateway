import { useTranslations } from 'next-intl';
import { UserFactory } from 'tests/factories';
import { getAuthMock, routerReplaceMock } from 'tests/mocks';
import { render, renderHook, screen, waitFor } from 'tests/test-utils';

import UserSettings from '@/app/[locale]/settings/page';
import { Navigation } from '@/constants';
import { usePageTracking } from '@/hooks/use-page-tracking';

describe('user settings page tests', () => {
	const {
		result: { current: t },
	} = renderHook(() => useTranslations('userSettings'));

	beforeEach(() => {
		getAuthMock.mockImplementation(() => ({
			currentUser: UserFactory.build(),
			setPersistence: vi.fn(),
		}));
	});

	afterEach(() => {
		getAuthMock.mockReset();
	});

	it('should route to sign in page when user is not present', async () => {
		getAuthMock.mockImplementationOnce(() => ({
			currentUser: null,
			setPersistence: vi.fn(),
		}));
		render(<UserSettings />);
		await waitFor(() => {
			expect(routerReplaceMock).toHaveBeenCalledWith(Navigation.SignIn);
		});
	});

	it('should render headline', () => {
		render(<UserSettings />);
		const [headline] = screen.getAllByText(t('headline'));
		expect(headline).toBeInTheDocument();
	});

	it('call page tracking hook', async () => {
		render(<UserSettings />);
		await waitFor(() => {
			expect(usePageTracking).toHaveBeenCalledWith('user-settings');
		});
	});
});

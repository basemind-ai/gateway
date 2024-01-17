import { UserInfo } from '@firebase/auth';
import { useTranslations } from 'next-intl';
import { act } from 'react-dom/test-utils';
import { ProjectFactory } from 'tests/factories';
import {
	getAuthMock,
	mockFetch,
	mockPage,
	mockReady,
	routerReplaceMock,
} from 'tests/mocks';
import { render, renderHook, screen, waitFor } from 'tests/test-utils';
import { beforeEach, expect } from 'vitest';

import Support from '@/app/[locale]/support/page';
import { Navigation } from '@/constants';
import { useSetProjects, useSetUser } from '@/stores/api-store';

describe('Support Page Tests', () => {
	const {
		result: { current: t },
	} = renderHook(() => useTranslations('support'));

	const {
		result: { current: setProjects },
	} = renderHook(() => useSetProjects());

	beforeEach(() => {
		act(() => {
			setProjects(ProjectFactory.batchSync(1));
		});

		mockFetch.mockResolvedValueOnce({
			json: () => Promise.resolve(ProjectFactory.batchSync(1)),
			ok: true,
		});
	});

	const mockUser: UserInfo = {
		displayName: 'Skywalker',
		email: 'Skywalker@gmail.com',
		phoneNumber: '',
		photoURL: 'https://picsum.photos/200',
		providerId: '',
		uid: '',
	};

	it('route to sign in page when user is not authenticate', async () => {
		const {
			result: { current: setUser },
		} = renderHook(() => useSetUser());

		act(() => {
			setUser(null);
		});

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
			expect(mockReady).toHaveBeenCalled();
		});

		await waitFor(() => {
			expect(mockPage).toHaveBeenCalledWith(
				'support',
				expect.any(Object),
			);
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

import { screen } from '@testing-library/react';
import { useTranslations } from 'next-intl';
import { UserFactory } from 'tests/factories';
import { getAuthMock } from 'tests/mocks';
import {
	render,
	renderHook,
	routerReplaceMock,
	waitFor,
} from 'tests/test-utils';
import { describe, it } from 'vitest';

import * as ApplicationAPI from '@/api/applications-api';
import * as PromptConfigAPI from '@/api/prompt-config-api';
import PickConfigPage from '@/app/[locale]/projects/[projectId]/testing/page';
import { Navigation } from '@/constants';

describe('pick config page tests', () => {
	const {
		result: { current: t },
	} = renderHook(() => useTranslations('promptTesting'));

	vi.spyOn(
		PromptConfigAPI,
		'handleRetrievePromptConfigs',
	).mockResolvedValueOnce([]);
	vi.spyOn(
		ApplicationAPI,
		'handleRetrieveApplications',
	).mockResolvedValueOnce([]);

	beforeEach(() => {
		getAuthMock.mockImplementation(() => ({
			currentUser: UserFactory.build(),
			setPersistence: vi.fn(),
		}));
	});

	afterEach(() => {
		getAuthMock.mockReset();
	});

	it('should redirects unauthenticated user to login page', async () => {
		getAuthMock.mockImplementationOnce(() => ({
			currentUser: null,
			setPersistence: vi.fn(),
		}));
		render(
			<PickConfigPage
				params={{
					projectId: '',
				}}
			/>,
		);
		await waitFor(() => {
			expect(routerReplaceMock).toHaveBeenCalledWith(Navigation.SignIn);
		});
	});

	it('should render component', () => {
		render(
			<PickConfigPage
				params={{
					projectId: '',
				}}
			/>,
		);
		expect(screen.getByTestId('pick-config-page')).toBeInTheDocument();
	});

	it('should render headline', () => {
		render(
			<PickConfigPage
				params={{
					projectId: '',
				}}
			/>,
		);
		const headline = screen.getByText(t('headlineTesting'));
		expect(headline).toBeInTheDocument();
	});

	it('should render pick section heading', () => {
		render(
			<PickConfigPage
				params={{
					projectId: '',
				}}
			/>,
		);
		const pickSectionHeading = screen.getByText(t('pickConfigHeading'));
		expect(pickSectionHeading).toBeInTheDocument();
	});
});

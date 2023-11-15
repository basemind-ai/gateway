import { fireEvent, screen, waitFor } from '@testing-library/react';
import { useTranslations } from 'next-intl';
import { ApplicationFactory, PromptConfigFactory } from 'tests/factories';
import { routerPushMock } from 'tests/mocks';
import { render, renderHook } from 'tests/test-utils';
import { beforeEach, describe, expect } from 'vitest';

import * as PromptConfigAPI from '@/api/prompt-config-api';
import { AllConfigsTable } from '@/components/testing/all-configs-table';
import { ApiError } from '@/errors';
import { ToastType } from '@/stores/toast-store';

// eslint-disable-next-line vitest/valid-describe-callback
describe('AllConfigsTable component tests', async () => {
	const {
		result: { current: t },
	} = renderHook(() => useTranslations('promptTesting'));
	const projectId = '1';
	const handleRetrievePromptConfigsSpy = vi.spyOn(
		PromptConfigAPI,
		'handleRetrievePromptConfigs',
	);

	const mockApplications = await ApplicationFactory.batch(1);
	const mockConfigs = await PromptConfigFactory.batch(2);
	const handleNoConfigsMock = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders loading state table and calling handleRetrievePromptConfigs', async () => {
		handleRetrievePromptConfigsSpy.mockResolvedValueOnce(mockConfigs);
		render(
			<AllConfigsTable
				projectId={projectId}
				applications={mockApplications}
				handleNoConfigs={handleNoConfigsMock}
			/>,
		);
		expect(
			screen.getByTestId('loading-all-configs-table'),
		).toBeInTheDocument();
		await waitFor(() => {
			expect(handleRetrievePromptConfigsSpy).toHaveBeenCalled();
		});
	});

	it('renders all configs list', async () => {
		handleRetrievePromptConfigsSpy.mockResolvedValueOnce(mockConfigs);
		render(
			<AllConfigsTable
				projectId={projectId}
				applications={mockApplications}
				handleNoConfigs={handleNoConfigsMock}
			/>,
		);
		await waitFor(() => {
			expect(screen.getByTestId('all-configs-table')).toBeInTheDocument();
		});
		expect(screen.getByText(t('name'))).toBeInTheDocument();
		expect(screen.getByText(t('pick'))).toBeInTheDocument();
		expect(screen.getByText(t('vendor'))).toBeInTheDocument();
		expect(screen.getByText(t('model'))).toBeInTheDocument();
		expect(screen.getByText(t('variables'))).toBeInTheDocument();
		expect(screen.getByText(t('partOfApplication'))).toBeInTheDocument();
	});
	it('clicking on config name push test screen', async () => {
		handleRetrievePromptConfigsSpy.mockResolvedValueOnce(mockConfigs);
		render(
			<AllConfigsTable
				projectId={projectId}
				applications={mockApplications}
				handleNoConfigs={handleNoConfigsMock}
			/>,
		);
		await waitFor(() => {
			expect(screen.getByText(mockConfigs[0].name)).toBeInTheDocument();
		});
		screen.getByText(mockConfigs[0].name).click();
		await waitFor(() => {
			expect(routerPushMock).toHaveBeenCalled();
		});
	});

	it('clicking on config test button should push a new', async () => {
		handleRetrievePromptConfigsSpy.mockResolvedValueOnce(mockConfigs);
		render(
			<AllConfigsTable
				projectId={projectId}
				applications={mockApplications}
				handleNoConfigs={handleNoConfigsMock}
			/>,
		);
		await waitFor(() => {
			fireEvent.click(
				screen.getByTestId(`${mockConfigs[0].id}test-config-button`),
			);
		});
		await waitFor(() => {
			expect(routerPushMock).toHaveBeenCalled();
		});
	});

	it('when user has no configs, should trigger handleNoConfig', async () => {
		handleRetrievePromptConfigsSpy.mockResolvedValueOnce([]);
		render(
			<AllConfigsTable
				projectId={projectId}
				applications={mockApplications}
				handleNoConfigs={handleNoConfigsMock}
			/>,
		);
		await waitFor(() => {
			expect(handleNoConfigsMock).toHaveBeenCalled();
		});
	});

	it('when api configs throws an error should call useError', async () => {
		handleRetrievePromptConfigsSpy.mockImplementationOnce(() => {
			throw new ApiError('unable to fetch prompt configs', {
				statusCode: 401,
				statusText: 'Bad Request',
			});
		});
		render(
			<AllConfigsTable
				projectId={projectId}
				applications={mockApplications}
				handleNoConfigs={handleNoConfigsMock}
			/>,
		);
		await waitFor(() => {
			const errorToast = screen.getByText(
				'unable to fetch prompt configs',
			);
			expect(errorToast.className).toContain(ToastType.ERROR);
		});
	});
});

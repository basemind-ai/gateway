import { fireEvent, screen, waitFor } from '@testing-library/react';
import { useTranslations } from 'next-intl';
import { ApplicationFactory, PromptConfigFactory } from 'tests/factories';
import { routerPushMock } from 'tests/mocks';
import { render, renderHook } from 'tests/test-utils';
import { beforeEach, describe, expect } from 'vitest';

import * as ApplicationAPI from '@/api/applications-api';
import * as PromptConfigAPI from '@/api/prompt-config-api';
import { AllConfigsTable } from '@/components/testing/all-configs-table';
import { ApiError } from '@/errors';
import { ToastType } from '@/stores/toast-store';

// eslint-disable-next-line vitest/valid-describe-callback
describe('AllConfigsTable component tests', async () => {
	const {
		result: { current: t },
	} = renderHook(() => useTranslations('testing'));
	const projectId = '1';
	const handleRetrievePromptConfigsSpy = vi.spyOn(
		PromptConfigAPI,
		'handleRetrievePromptConfigs',
	);
	const handleRetrieveApplicationsSpy = vi.spyOn(
		ApplicationAPI,
		'handleRetrieveApplications',
	);
	const mockApplications = await ApplicationFactory.batch(1);
	const mockConfigs = await PromptConfigFactory.batch(2);
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders loading state table', async () => {
		render(<AllConfigsTable projectId={projectId} />);
		expect(
			screen.getByTestId('loading-all-configs-table'),
		).toBeInTheDocument();
		// test that spy is called
		await waitFor(() => {
			expect(handleRetrieveApplicationsSpy).toHaveBeenCalled();
		});
	});
	it('renders all configs list', async () => {
		handleRetrieveApplicationsSpy.mockResolvedValueOnce(mockApplications);
		handleRetrievePromptConfigsSpy.mockResolvedValueOnce(mockConfigs);
		render(<AllConfigsTable projectId={projectId} />);
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
		handleRetrieveApplicationsSpy.mockResolvedValueOnce(mockApplications);
		handleRetrievePromptConfigsSpy.mockResolvedValueOnce(mockConfigs);
		render(<AllConfigsTable projectId={projectId} />);
		await waitFor(() => {
			expect(screen.getByText(mockConfigs[0].name)).toBeInTheDocument();
		});
		screen.getByText(mockConfigs[0].name).click();
		await waitFor(() => {
			expect(routerPushMock).toHaveBeenCalled();
		});
	});

	it('clicking on config test button should push a new', async () => {
		handleRetrieveApplicationsSpy.mockResolvedValueOnce(mockApplications);
		handleRetrievePromptConfigsSpy.mockResolvedValueOnce(mockConfigs);
		render(<AllConfigsTable projectId={projectId} />);
		await waitFor(() => {
			fireEvent.click(
				screen.getByTestId(`${mockConfigs[0].id}test-config-button`),
			);
		});
		await waitFor(() => {
			expect(routerPushMock).toHaveBeenCalled();
		});
	});

	it('when user has no applications, should route to testing new config', async () => {
		handleRetrieveApplicationsSpy.mockResolvedValueOnce([]);
		render(<AllConfigsTable projectId={projectId} />);
		await waitFor(() => {
			expect(routerPushMock).toHaveBeenCalled();
		});
	});
	it('when user has no configs, should route to testing new config', async () => {
		handleRetrieveApplicationsSpy.mockResolvedValueOnce(mockApplications);
		handleRetrievePromptConfigsSpy.mockResolvedValueOnce([]);
		render(<AllConfigsTable projectId={projectId} />);
		await waitFor(() => {
			expect(routerPushMock).toHaveBeenCalled();
		});
	});

	it('when api application throws an error should call useError', async () => {
		handleRetrieveApplicationsSpy.mockImplementationOnce(() => {
			throw new ApiError('unable to fetch applications', {
				statusCode: 401,
				statusText: 'Bad Request',
			});
		});
		render(<AllConfigsTable projectId={projectId} />);
		await waitFor(() => {
			const errorToast = screen.getByText('unable to fetch applications');
			expect(errorToast.className).toContain(ToastType.ERROR);
		});
	});
	it('when api configs throws an error should call useError', async () => {
		handleRetrieveApplicationsSpy.mockResolvedValueOnce(mockApplications);

		handleRetrievePromptConfigsSpy.mockImplementationOnce(() => {
			throw new ApiError('unable to fetch prompt configs', {
				statusCode: 401,
				statusText: 'Bad Request',
			});
		});
		render(<AllConfigsTable projectId={projectId} />);
		await waitFor(() => {
			const errorToast = screen.getByText(
				'unable to fetch prompt configs',
			);
			expect(errorToast.className).toContain(ToastType.ERROR);
		});
	});
});

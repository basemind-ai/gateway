import { waitFor } from '@testing-library/react';
import { useTranslations } from 'next-intl';
import { OpenAIPromptConfigFactory } from 'tests/factories';
import { fireEvent, render, renderHook, screen } from 'tests/test-utils';
import { expect } from 'vitest';

import * as PromptConfigAPI from '@/api/prompt-config-api';
import { PromptConfigAnalyticsPage } from '@/components/projects/[projectId]/applications/[applicationId]/configs/[configId]/prompt-config-analytics-page';
import { ApiError } from '@/errors';
import { ToastType } from '@/stores/toast-store';
import { Analytics } from '@/types';

describe('PromptAnalyticsPage', () => {
	const projectId = '1';
	const applicationId = '2';
	const promptConfigId = '3';

	const handlePromptConfigAnalyticsSpy = vi.spyOn(
		PromptConfigAPI,
		'handlePromptConfigAnalytics',
	);

	beforeEach(() => {
		vi.resetAllMocks();
	});

	it('renders analytics', async () => {
		const {
			result: { current: t },
		} = renderHook(() => useTranslations('application'));
		const analytics = {
			tokensCost: 3,
			totalRequests: 434,
		} satisfies Analytics;
		const promptConfig = await OpenAIPromptConfigFactory.build({
			id: promptConfigId,
		});
		handlePromptConfigAnalyticsSpy.mockResolvedValueOnce(analytics);

		render(
			<PromptConfigAnalyticsPage
				projectId={projectId}
				applicationId={applicationId}
				promptConfig={promptConfig}
			/>,
		);
		await screen.findByTestId('prompt-analytics-container');
		const apiCalls = screen.getByTestId(
			`data-card-total-value-${t('apiCalls')}`,
		);
		const modelsCost = screen.getByTestId(
			`data-card-total-value-${t('modelsCost')}`,
		);

		expect(apiCalls.innerHTML).toBe(analytics.totalRequests.toString());
		expect(modelsCost.innerHTML).toBe(`${analytics.tokensCost}$`);
	});

	it('renders updated analytics on date change', async () => {
		const {
			result: { current: t },
		} = renderHook(() => useTranslations('application'));
		const initialAnalytics = {
			tokensCost: 3,
			totalRequests: 434,
		} satisfies Analytics;
		handlePromptConfigAnalyticsSpy.mockResolvedValueOnce(initialAnalytics);
		const promptConfig = await OpenAIPromptConfigFactory.build({
			id: promptConfigId,
		});

		render(
			<PromptConfigAnalyticsPage
				projectId={projectId}
				applicationId={applicationId}
				promptConfig={promptConfig}
			/>,
		);
		await screen.findByTestId('prompt-analytics-container');

		const apiCalls = screen.getByTestId(
			`data-card-total-value-${t('apiCalls')}`,
		);

		const updatedAnalytics = {
			tokensCost: 4,
			totalRequests: 474,
		} satisfies Analytics;
		handlePromptConfigAnalyticsSpy.mockResolvedValueOnce(updatedAnalytics);

		const datePicker = screen.getByTestId('datepicker');
		fireEvent.click(datePicker);
		const todayBtn = screen.getByText('Today');
		fireEvent.click(todayBtn);

		await waitFor(() => {
			expect(apiCalls.innerHTML).toBe(
				updatedAnalytics.totalRequests.toString(),
			);
		});
	});

	it('shows error when unable to fetch analytics', async () => {
		handlePromptConfigAnalyticsSpy.mockImplementationOnce(() => {
			throw new ApiError('unable to fetch prompt config analytics', {
				statusCode: 401,
				statusText: 'Bad Request',
			});
		});
		const promptConfig = await OpenAIPromptConfigFactory.build({
			id: promptConfigId,
		});

		render(
			<PromptConfigAnalyticsPage
				projectId={projectId}
				applicationId={applicationId}
				promptConfig={promptConfig}
			/>,
		);
		const errorToast = screen.getByText(
			'unable to fetch prompt config analytics',
		);
		expect(errorToast.className).toContain(ToastType.ERROR);
	});
});

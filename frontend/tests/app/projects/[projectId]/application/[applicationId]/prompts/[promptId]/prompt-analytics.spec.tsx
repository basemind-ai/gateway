import { waitFor } from '@testing-library/react';
import { useTranslations } from 'next-intl';
import { fireEvent, render, renderHook, screen } from 'tests/test-utils';

import * as PromptConfigAPI from '@/api/prompt-config-api';
import { PromptAnalyticsPage } from '@/components/projects/[projectId]/applications/[applicationId]/prompts/[promptId]/prompt-analytics-page';
import { ApiError } from '@/errors';
import { ToastType } from '@/stores/toast-store';
import { AnalyticsDTO } from '@/types';

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
			totalRequests: 434,
			tokensCost: 3,
		} satisfies AnalyticsDTO;
		handlePromptConfigAnalyticsSpy.mockResolvedValueOnce(analytics);

		await waitFor(() =>
			render(
				<PromptAnalyticsPage
					projectId={projectId}
					applicationId={applicationId}
					promptConfigId={promptConfigId}
				/>,
			),
		);
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
			totalRequests: 434,
			tokensCost: 3,
		} satisfies AnalyticsDTO;
		handlePromptConfigAnalyticsSpy.mockResolvedValueOnce(initialAnalytics);

		await waitFor(() =>
			render(
				<PromptAnalyticsPage
					projectId={projectId}
					applicationId={applicationId}
					promptConfigId={promptConfigId}
				/>,
			),
		);

		const apiCalls = screen.getByTestId(
			`data-card-total-value-${t('apiCalls')}`,
		);

		const updatedAnalytics = {
			totalRequests: 474,
			tokensCost: 4,
		} satisfies AnalyticsDTO;
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

	it('shows error when unable to fetch analytics', () => {
		handlePromptConfigAnalyticsSpy.mockImplementationOnce(() => {
			throw new ApiError('unable to fetch prompt config analytics', {
				statusCode: 401,
				statusText: 'Bad Request',
			});
		});

		render(
			<PromptAnalyticsPage
				projectId={projectId}
				applicationId={applicationId}
				promptConfigId={promptConfigId}
			/>,
		);
		const errorToast = screen.getByText(
			'unable to fetch prompt config analytics',
		);
		expect(errorToast.className).toContain(ToastType.ERROR);
	});
});

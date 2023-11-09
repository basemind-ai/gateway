import { waitFor } from '@testing-library/react';
import { useTranslations } from 'next-intl';
import { fireEvent, render, renderHook, screen } from 'tests/test-utils';

import * as ProjectAPI from '@/api/projects-api';
import { ProjectAnalytics } from '@/components/projects/[projectId]/project-analytics';
import { AnalyticsDTO } from '@/types';

describe('ProjectAnalytics', () => {
	const projectId = '1';
	const handleProjectAnalyticsSpy = vi.spyOn(
		ProjectAPI,
		'handleProjectAnalytics',
	);

	beforeEach(() => {
		vi.resetAllMocks();
	});

	it('renders project analytics', async () => {
		const {
			result: { current: t },
		} = renderHook(() => useTranslations('projectOverview'));
		const analytics = {
			totalRequests: 4374,
			tokensCost: 35,
		} satisfies AnalyticsDTO;
		handleProjectAnalyticsSpy.mockResolvedValueOnce(analytics);

		await waitFor(() => render(<ProjectAnalytics projectId={projectId} />));

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
		} = renderHook(() => useTranslations('projectOverview'));
		const initialAnalytics = {
			totalRequests: 434,
			tokensCost: 3,
		} satisfies AnalyticsDTO;
		handleProjectAnalyticsSpy.mockResolvedValueOnce(initialAnalytics);

		await waitFor(() => render(<ProjectAnalytics projectId={projectId} />));

		const apiCalls = screen.getByTestId(
			`data-card-total-value-${t('apiCalls')}`,
		);
		expect(apiCalls.innerHTML).toBe(
			initialAnalytics.totalRequests.toString(),
		);

		const updatedAnalytics = {
			totalRequests: 474,
			tokensCost: 5.2,
		} satisfies AnalyticsDTO;
		handleProjectAnalyticsSpy.mockResolvedValueOnce(updatedAnalytics);

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
});

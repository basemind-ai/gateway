import { waitFor } from '@testing-library/react';
import { useTranslations } from 'next-intl';
import { fireEvent, render, renderHook, screen } from 'tests/test-utils';

import * as ApplicationConfigAPI from '@/api/applications-api';
import { ApplicationAnalytics } from '@/app/projects/[projectId]/applications/[applicationId]/page';

describe('ApplicationAnalytics', () => {
	const projectId = '1';
	const applicationId = '2';
	const handleApplicationAnalyticsSpy = vi.spyOn(
		ApplicationConfigAPI,
		'handleApplicationAnalytics',
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
			projectedCost: 3,
		};
		handleApplicationAnalyticsSpy.mockResolvedValueOnce(analytics);

		await waitFor(() =>
			render(
				<ApplicationAnalytics
					projectId={projectId}
					applicationId={applicationId}
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
		expect(modelsCost.innerHTML).toBe(`${analytics.projectedCost}$`);
	});

	it('renders updated analytics on date change', async () => {
		const {
			result: { current: t },
		} = renderHook(() => useTranslations('application'));
		const initialAnalytics = {
			totalRequests: 434,
			projectedCost: 3,
		};
		handleApplicationAnalyticsSpy.mockResolvedValueOnce(initialAnalytics);

		await waitFor(() =>
			render(
				<ApplicationAnalytics
					projectId={projectId}
					applicationId={applicationId}
				/>,
			),
		);

		const apiCalls = screen.getByTestId(
			`data-card-total-value-${t('apiCalls')}`,
		);
		expect(apiCalls.innerHTML).toBe(
			initialAnalytics.totalRequests.toString(),
		);

		const updatedAnalytics = {
			totalRequests: 474,
			projectedCost: 4,
		};
		handleApplicationAnalyticsSpy.mockResolvedValueOnce(updatedAnalytics);

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

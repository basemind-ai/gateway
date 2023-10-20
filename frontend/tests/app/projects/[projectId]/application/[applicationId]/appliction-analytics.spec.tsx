import { waitFor } from '@testing-library/react';
import { fireEvent, render, screen } from 'tests/test-utils';
import { describe, expect } from 'vitest';

import * as ApplicationConfigAPI from '@/api/applications-api';
import { ApplicationAnalytics } from '@/app/projects/[projectId]/application/[applicationId]/page';

describe('ApplicationAnalytics', () => {
	const projectId = '1';
	const applicationId = '2';
	const handleApplicationAnalyticsSpy = vi.spyOn(
		ApplicationConfigAPI,
		'handleApplicationAnalytics',
	);

	it('renders analytics', async () => {
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

		const [apiCalls, modelsCost] = screen.getAllByTestId(
			'data-card-total-value',
		);

		expect(apiCalls.innerHTML).toBe(analytics.totalRequests.toString());
		expect(modelsCost.innerHTML).toBe(`${analytics.projectedCost}$`);
	});

	it('renders updated analytics on date change', async () => {
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

		const [apiCalls] = screen.getAllByTestId('data-card-total-value');
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

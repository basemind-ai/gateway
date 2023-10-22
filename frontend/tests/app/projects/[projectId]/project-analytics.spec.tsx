import { waitFor } from '@testing-library/react';
import { fireEvent, render, screen } from 'tests/test-utils';
import { describe, expect } from 'vitest';

import * as ProjectAPI from '@/api/projects-api';
import { ProjectAnalytics } from '@/app/projects/[projectId]/page';

describe('ProjectAnalytics', () => {
	const projectId = '1';
	const handleProjectAnalyticsSpy = vi.spyOn(
		ProjectAPI,
		'handleProjectAnalytics',
	);

	it('renders project analytics', async () => {
		const analytics = {
			totalAPICalls: 4374,
			modelsCost: 35,
		};
		handleProjectAnalyticsSpy.mockResolvedValueOnce(analytics);

		await waitFor(() => render(<ProjectAnalytics projectId={projectId} />));

		const [apiCalls, modelsCost] = screen.getAllByTestId(
			'data-card-total-value',
		);

		expect(apiCalls.innerHTML).toBe(analytics.totalAPICalls.toString());
		expect(modelsCost.innerHTML).toBe(`${analytics.modelsCost}$`);
	});

	it('renders updated analytics on date change', async () => {
		const initialAnalytics = {
			totalAPICalls: 434,
			modelsCost: 3,
		};
		handleProjectAnalyticsSpy.mockResolvedValueOnce(initialAnalytics);

		await waitFor(() => render(<ProjectAnalytics projectId={projectId} />));

		const [apiCalls] = screen.getAllByTestId('data-card-total-value');
		expect(apiCalls.innerHTML).toBe(
			initialAnalytics.totalAPICalls.toString(),
		);

		const updatedAnalytics = {
			totalAPICalls: 474,
			modelsCost: 5.2,
		};
		handleProjectAnalyticsSpy.mockResolvedValueOnce(updatedAnalytics);

		const datePicker = screen.getByTestId('datepicker');
		fireEvent.click(datePicker);
		const todayBtn = screen.getByText('Today');
		fireEvent.click(todayBtn);

		await waitFor(() => {
			expect(apiCalls.innerHTML).toBe(
				updatedAnalytics.totalAPICalls.toString(),
			);
		});
	});
});

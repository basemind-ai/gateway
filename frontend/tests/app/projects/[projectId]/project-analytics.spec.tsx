import { waitFor } from '@testing-library/react';
import { useTranslations } from 'next-intl';
import { fireEvent, render, renderHook, screen } from 'tests/test-utils';
import { describe, expect } from 'vitest';

import * as ProjectAPI from '@/api/projects-api';
import { ProjectAnalytics } from '@/components/projects/[projectId]/project-analytics';

describe('ProjectAnalytics', () => {
	const projectId = '1';
	const handleProjectAnalyticsSpy = vi.spyOn(
		ProjectAPI,
		'handleProjectAnalytics',
	);

	it('renders project analytics', async () => {
		const {
			result: { current: t },
		} = renderHook(() => useTranslations('projectOverview'));
		const analytics = {
			totalAPICalls: 4374,
			modelsCost: 35,
		};
		handleProjectAnalyticsSpy.mockResolvedValueOnce(analytics);

		await waitFor(() => render(<ProjectAnalytics projectId={projectId} />));

		const apiCalls = screen.getByTestId(
			`data-card-total-value-${t('apiCalls')}`,
		);
		const modelsCost = screen.getByTestId(
			`data-card-total-value-${t('modelsCost')}`,
		);

		expect(apiCalls.innerHTML).toBe(analytics.totalAPICalls.toString());
		expect(modelsCost.innerHTML).toBe(`${analytics.modelsCost}$`);
	});

	it('renders updated analytics on date change', async () => {
		const {
			result: { current: t },
		} = renderHook(() => useTranslations('projectOverview'));
		const initialAnalytics = {
			totalAPICalls: 434,
			modelsCost: 3,
		};
		handleProjectAnalyticsSpy.mockResolvedValueOnce(initialAnalytics);

		await waitFor(() => render(<ProjectAnalytics projectId={projectId} />));

		const apiCalls = screen.getByTestId(
			`data-card-total-value-${t('apiCalls')}`,
		);
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

import { useTranslations } from 'next-intl';
import { ProjectFactory } from 'tests/factories';
import {
	fireEvent,
	render,
	renderHook,
	screen,
	waitFor,
} from 'tests/test-utils';

import * as ProjectAPI from '@/api/projects-api';
import { ProjectAnalytics } from '@/components/projects/[projectId]/project-analytics';
import { useTrackPage } from '@/hooks/use-track-page';
import { Analytics } from '@/types';

describe('ProjectAnalytics', () => {
	const project = ProjectFactory.buildSync();
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
			tokensCost: 35,
			totalRequests: 4374,
		} satisfies Analytics;
		handleProjectAnalyticsSpy.mockResolvedValueOnce(analytics);

		render(<ProjectAnalytics project={project} />);
		await waitFor(() => {
			expect(
				screen.getByTestId('project-analytics-container'),
			).toBeInTheDocument();
		});

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
			tokensCost: 3,
			totalRequests: 434,
		} satisfies Analytics;
		handleProjectAnalyticsSpy.mockResolvedValueOnce(initialAnalytics);

		render(<ProjectAnalytics project={project} />);
		await waitFor(() => {
			expect(
				screen.getByTestId('project-analytics-container'),
			).toBeInTheDocument();
		});

		const apiCalls = screen.getByTestId(
			`data-card-total-value-${t('apiCalls')}`,
		);
		expect(apiCalls.innerHTML).toBe(
			initialAnalytics.totalRequests.toString(),
		);

		const updatedAnalytics = {
			tokensCost: 5.2,
			totalRequests: 474,
		} satisfies Analytics;
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

	it('calls usePageTracking hook with project-overview', async () => {
		render(<ProjectAnalytics project={project} />);
		await waitFor(() => {
			expect(useTrackPage).toHaveBeenCalledWith('project-overview');
		});
	});
});

import { faker } from '@faker-js/faker';
import { useTranslations } from 'next-intl';
import { ApplicationFactory } from 'tests/factories';
import {
	fireEvent,
	render,
	renderHook,
	screen,
	waitFor,
} from 'tests/test-utils';
import { MockInstance } from 'vitest';

import * as ApplicationConfigAPI from '@/api/applications-api';
import { ApplicationAnalytics } from '@/components/projects/[projectId]/applications/[applicationId]/application-analytics';
import * as useTrackPagePackage from '@/hooks/use-track-page';
import { Analytics } from '@/types';

describe('ApplicationAnalytics', () => {
	const projectId = faker.string.uuid();
	const application = ApplicationFactory.buildSync();
	const handleApplicationAnalyticsSpy = vi.spyOn(
		ApplicationConfigAPI,
		'handleApplicationAnalytics',
	);
	let useTrackPageSpy: MockInstance;
	beforeEach(() => {
		useTrackPageSpy = vi.spyOn(useTrackPagePackage, 'useTrackPage');
	});

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
		handleApplicationAnalyticsSpy.mockResolvedValueOnce(analytics);

		render(
			<ApplicationAnalytics
				projectId={projectId}
				application={application}
			/>,
		);
		await screen.findByTestId('application-analytics-container');

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
		handleApplicationAnalyticsSpy.mockResolvedValueOnce(initialAnalytics);

		render(
			<ApplicationAnalytics
				projectId={projectId}
				application={application}
			/>,
		);
		await screen.findByTestId('application-analytics-container');

		const apiCalls = screen.getByTestId(
			`data-card-total-value-${t('apiCalls')}`,
		);

		const updatedAnalytics = {
			tokensCost: 4,
			totalRequests: 474,
		} satisfies Analytics;
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

	it('calls pageTracking with application overview', async () => {
		render(
			<ApplicationAnalytics
				projectId={projectId}
				application={application}
			/>,
		);
		await waitFor(() => {
			expect(useTrackPageSpy).toHaveBeenCalledWith(
				'application-overview',
			);
		});
	});
});

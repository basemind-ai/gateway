import { ProjectFactory } from 'tests/factories';
import { render, renderHook, screen, waitFor } from 'tests/test-utils';
import { describe, expect } from 'vitest';

import * as ApplicationAPI from '@/api/applications-api';
import * as ProjectAPI from '@/api/projects-api';
import ProjectOverview from '@/app/projects/[projectId]/page';
import { useSetProjects } from '@/stores/project-store';

describe('ProjectOverview', () => {
	const handleProjectAnalyticsSpy = vi.spyOn(
		ProjectAPI,
		'handleProjectAnalytics',
	);
	const handleRetrieveApplicationsSpy = vi.spyOn(
		ApplicationAPI,
		'handleRetrieveApplications',
	);

	it('renders null when project is not present', () => {
		const {
			result: { current: setProjects },
		} = renderHook(useSetProjects);
		const projects = ProjectFactory.batchSync(1);
		setProjects(projects);

		const { container } = render(
			<ProjectOverview
				params={{
					projectId: '4343',
				}}
			/>,
		);

		expect(container).toBeEmptyDOMElement();
	});

	it('renders all 4 screens in tab navigation', async () => {
		const {
			result: { current: setProjects },
		} = renderHook(useSetProjects);
		const projects = await ProjectFactory.batch(1);
		setProjects(projects);

		handleProjectAnalyticsSpy.mockResolvedValueOnce({
			totalAPICalls: 2,
			modelsCost: 2,
		});
		handleRetrieveApplicationsSpy.mockReturnValueOnce(Promise.resolve([]));

		render(
			<ProjectOverview
				params={{
					projectId: projects[0].id,
				}}
			/>,
		);

		await waitFor(() => {
			const pageTitle = screen.getByTestId('project-page-title');
			expect(pageTitle.innerHTML).toContain(projects[0].name);
		});

		// 	Renders overview
		const analytics = screen.getByTestId('project-analytics-container');
		expect(analytics).toBeInTheDocument();
		const applicationList = screen.getByTestId(
			'project-application-list-container',
		);
		expect(applicationList).toBeInTheDocument();

		// const [, membersTab, billingTab, settingsTab] =
		// 	screen.getAllByTestId('tab-navigation-btn');
		// 	TODO: Handle other screens as they are made
	});
});

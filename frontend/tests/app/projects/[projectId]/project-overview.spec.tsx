import { fireEvent } from '@testing-library/react';
import { ProjectFactory, ProjectUserAccountFactory } from 'tests/factories';
import { render, renderHook, screen, waitFor } from 'tests/test-utils';

import * as ApplicationAPI from '@/api/applications-api';
import * as ProjectUsersAPI from '@/api/project-users-api';
import ProjectOverview from '@/app/projects/[projectId]/page';
import { useSetProjects } from '@/stores/project-store';

describe('ProjectOverview', () => {
	const handleRetrieveApplicationsSpy = vi.spyOn(
		ApplicationAPI,
		'handleRetrieveApplications',
	);
	const handleRetrieveProjectUsersSpy = vi.spyOn(
		ProjectUsersAPI,
		'handleRetrieveProjectUsers',
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

		const [, membersTab, billingTab, settingsTab] =
			screen.getAllByTestId('tab-navigation-btn');

		// 	Renders members
		const projectUsers = ProjectUserAccountFactory.batchSync(1);
		handleRetrieveProjectUsersSpy.mockResolvedValueOnce(projectUsers);
		fireEvent.click(membersTab);
		const inviteMember = screen.getByTestId('project-invite-member');
		expect(inviteMember).toBeInTheDocument();
		const projectMembers = screen.getByTestId('project-members-container');
		expect(projectMembers).toBeInTheDocument();

		// 	Renders billing
		// TODO: Update this after billing screen is made
		fireEvent.click(billingTab);

		// 	Renders Settings
		fireEvent.click(settingsTab);
		const generalSettings = screen.getByTestId(
			'project-general-settings-container',
		);
		expect(generalSettings).toBeInTheDocument();
		const projectDeletion = screen.getByTestId(
			'project-deletion-container',
		);
		expect(projectDeletion).toBeInTheDocument();
	});
});

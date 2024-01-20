import { act } from 'react-dom/test-utils';
import {
	ProjectFactory,
	ProjectUserAccountFactory,
	UserFactory,
} from 'tests/factories';
import { mockPage, mockReady } from 'tests/mocks';
import {
	fireEvent,
	render,
	renderHook,
	screen,
	waitFor,
} from 'tests/test-utils';

import * as ApplicationAPI from '@/api/applications-api';
import * as ProjectUsersAPI from '@/api/project-users-api';
import ProjectOverview from '@/app/[locale]/projects/[projectId]/page';
import { useSetProjects } from '@/stores/api-store';
import * as apiStore from '@/stores/api-store';
import { AccessPermission } from '@/types';

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

		act(() => {
			setProjects(projects);
		});

		render(
			<ProjectOverview
				params={{
					projectId: '4343',
				}}
			/>,
		);

		const container = screen.queryByTestId('project-page');
		expect(container).not.toBeInTheDocument();
	});

	it('renders all 4 screens in tab navigation', async () => {
		const {
			result: { current: setProjects },
		} = renderHook(useSetProjects);
		const projects = await ProjectFactory.batch(1);

		act(() => {
			setProjects(projects);
		});
		const user = UserFactory.buildSync();
		vi.spyOn(apiStore, 'useUser').mockReturnValue(user);

		handleRetrieveApplicationsSpy.mockReturnValueOnce(Promise.resolve([]));

		render(
			<ProjectOverview
				params={{
					projectId: projects[0].id,
				}}
			/>,
		);

		await waitFor(() => {
			const pageTitle = screen.getByTestId('navbar-container');
			expect(pageTitle.innerHTML).toContain(projects[0].name);
		});

		// 	Renders overview
		const analytics = screen.getByTestId('project-analytics-container');
		expect(analytics).toBeInTheDocument();
		const applicationList = screen.getByTestId(
			'project-application-list-container',
		);
		expect(applicationList).toBeInTheDocument();

		const [, membersTab, , settingsTab] =
			screen.getAllByTestId('tab-navigation-btn');

		// 	Renders members
		const projectUsers = ProjectUserAccountFactory.batchSync(1, {
			email: user.email!,
			permission: AccessPermission.ADMIN,
		});

		handleRetrieveProjectUsersSpy.mockResolvedValueOnce(projectUsers);
		fireEvent.click(membersTab);

		const projectMembers = screen.getByTestId('project-members-container');
		expect(projectMembers).toBeInTheDocument();

		await waitFor(() => {
			const inviteMember = screen.getByTestId('project-invite-member');

			expect(inviteMember).toBeInTheDocument();
		});

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

	it('call page analytics when initialized', async () => {
		const {
			result: { current: setProjects },
		} = renderHook(useSetProjects);
		const projects = await ProjectFactory.batch(1);

		act(() => {
			setProjects(projects);
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
			expect(mockReady).toHaveBeenCalled();
		});

		await waitFor(() => {
			expect(mockPage).toHaveBeenCalledWith(
				'Project Overview',
				expect.any(Object),
			);
		});
	});
});

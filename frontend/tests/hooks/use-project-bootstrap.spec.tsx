/* eslint-disable unicorn/no-abusive-eslint-disable,eslint-comments/no-unlimited-disable */
import { ApplicationFactory, ProjectFactory } from 'tests/factories';
import { routerReplaceMock } from 'tests/mocks';
import { act, renderHook } from 'tests/test-utils';

import * as applicationAPI from '@/api/applications-api';
import * as projectAPI from '@/api/projects-api';
import { Navigation } from '@/constants';
import { useProjectBootstrap } from '@/hooks/use-project-bootstrap';
import * as projectStore from '@/stores/project-store';

describe('useProjectBootstrap tests', () => {
	const setProjectsMock = vi.fn();
	vi.spyOn(projectStore, 'useSetProjects').mockReturnValue(setProjectsMock);

	const setCurrentProjectMock = vi.fn();
	vi.spyOn(projectStore, 'useSetSelectedProject').mockReturnValue(
		setCurrentProjectMock,
	);

	const setProjectApplicationsMock = vi.fn();
	vi.spyOn(projectStore, 'useSetProjectApplications').mockReturnValue(
		setProjectApplicationsMock,
	);

	beforeEach(() => {
		setProjectsMock.mockReset();
	});

	it('should not do anything if there are already projects in the store', async () => {
		const projects = ProjectFactory.batchSync(2);
		vi.spyOn(projectStore, 'useProjects').mockReturnValueOnce(projects);
		vi.spyOn(projectAPI, 'handleRetrieveProjects').mockReturnValueOnce(
			Promise.resolve(projects),
		);

		// eslint-disable-next-line
		await act(() => {
			renderHook(useProjectBootstrap);
		});

		expect(setProjectsMock).not.toHaveBeenCalledWith(projects);
		expect(routerReplaceMock).not.toHaveBeenCalled();
	});

	it('should sets projects, applications and navigates to project page', async () => {
		const projects = ProjectFactory.batchSync(2);
		const applications = ApplicationFactory.batchSync(2);
		vi.spyOn(projectStore, 'useProjects').mockReturnValueOnce([]);
		vi.spyOn(projectAPI, 'handleRetrieveProjects').mockReturnValueOnce(
			Promise.resolve(projects),
		);
		vi.spyOn(
			applicationAPI,
			'handleRetrieveApplications',
		).mockReturnValueOnce(Promise.resolve(applications));

		// eslint-disable-next-line
		await act(() => {
			renderHook(useProjectBootstrap);
		});

		expect(setProjectsMock).toHaveBeenCalledWith(projects);
		expect(setCurrentProjectMock).toHaveBeenCalledWith(projects[0].id);
		expect(routerReplaceMock).toHaveBeenCalledWith(
			`${Navigation.Projects}/${projects[0].id}`,
		);
		expect(setProjectApplicationsMock).toHaveBeenCalledWith(
			projects[0].id,
			applications,
		);
	});
});

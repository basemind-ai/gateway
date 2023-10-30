import {
	APIKeyFactory,
	ApplicationFactory,
	ProjectFactory,
	ProjectUserAccountFactory,
	PromptConfigFactory,
} from 'tests/factories';
import { renderHook } from 'tests/test-utils';

import {
	projectStoreStateCreator,
	useAddProject,
	useAddProjectUser,
	useAPIKeys,
	useApplication,
	useApplications,
	useCurrentProject,
	useDeleteApplication,
	useDeleteProject,
	useProject,
	useProjectUsers,
	usePromptConfig,
	useRemoveProjectUser,
	useSetAPIKeys,
	useSetCurrentProject,
	useSetProjectApplications,
	useSetProjects,
	useSetProjectUsers,
	useSetPromptConfig,
	useUpdateApplication,
	useUpdateProject,
	useUpdateProjectUser,
} from '@/stores/project-store';

describe('project-store tests', () => {
	describe('projectStoreStateCreator', () => {
		const set = vi.fn();
		const get = vi.fn();

		beforeEach(() => {
			vi.resetAllMocks();
		});

		it('sets projects', async () => {
			const store = projectStoreStateCreator(set, get, {} as any);
			const projects = await ProjectFactory.batch(1);
			store.setProjects(projects);
			expect(set).toHaveBeenCalledWith({ projects });
		});
	});

	describe('setProjects, useProject, addProject, updateProject and deleteProject', () => {
		it('sets and returns projects', async () => {
			const {
				result: { current: setProjects },
			} = renderHook(useSetProjects);

			const projects = await ProjectFactory.batch(1);
			setProjects(projects);

			const {
				result: { current: storedProjects },
			} = renderHook(() => useProject(projects[0].id));

			expect(storedProjects).toEqual(projects[0]);
		});

		it('adds and returns projects', async () => {
			const {
				result: { current: addProject },
			} = renderHook(useAddProject);

			const [project] = await ProjectFactory.batch(1);
			addProject(project);

			const {
				result: { current: storedProject },
			} = renderHook(() => useProject(project.id));

			expect(storedProject).toEqual(project);
		});

		it('updates a project', async () => {
			const {
				result: { current: setProjects },
			} = renderHook(useSetProjects);
			const projects = await ProjectFactory.batch(1);
			setProjects(projects);

			const {
				result: { current: updateProject },
			} = renderHook(useUpdateProject);
			const updatedProject = { ...projects[0], name: 'new name' };
			updateProject(updatedProject.id, updatedProject);

			const {
				result: { current: storedProject },
			} = renderHook(() => useProject(updatedProject.id));

			expect(storedProject).toEqual(updatedProject);
		});

		it('deletes a project', async () => {
			const {
				result: { current: setProjects },
			} = renderHook(useSetProjects);
			const projects = await ProjectFactory.batch(1);
			setProjects(projects);

			const {
				result: { current: deleteProject },
			} = renderHook(useDeleteProject);
			deleteProject(projects[0].id);

			const {
				result: { current: storedProject },
			} = renderHook(() => useProject(projects[0].id));

			expect(storedProject).toBeUndefined();
		});
	});

	describe('setCurrentProject and currentProject', () => {
		it('sets and gets current project', async () => {
			const {
				result: { current: setProjects },
			} = renderHook(useSetProjects);
			const projects = await ProjectFactory.batch(1);
			setProjects(projects);

			const {
				result: { current: setCurrentProject },
			} = renderHook(useSetCurrentProject);
			setCurrentProject(projects[0].id);

			const {
				result: { current: currentProject },
			} = renderHook(useCurrentProject);

			expect(currentProject).toEqual(projects[0]);
		});

		it('returns undefined in case of no current project', async () => {
			const {
				result: { current: setProjects },
			} = renderHook(useSetProjects);
			const projects = await ProjectFactory.batch(1);
			setProjects(projects);
			const {
				result: { current: setCurrentProject },
			} = renderHook(useSetCurrentProject);
			setCurrentProject(null);

			const {
				result: { current: currentProject },
			} = renderHook(useCurrentProject);

			expect(currentProject).toBeUndefined();
		});
	});

	describe('setProjectApplications, getApplications, getApplication, deleteApplication and updateApplication', () => {
		it('sets and gets project applications', async () => {
			const {
				result: { current: setProjects },
			} = renderHook(useSetProjects);
			const projects = await ProjectFactory.batch(1);
			setProjects(projects);

			const applications = await ApplicationFactory.batch(2);

			const {
				result: { current: setProjectApplications },
			} = renderHook(useSetProjectApplications);
			setProjectApplications(projects[0].id, applications);

			const {
				result: { current: applicationRes },
			} = renderHook(() => useApplications(projects[0].id));

			expect(applicationRes).toEqual(applications);
		});

		it('returns undefined in case of no project applications', async () => {
			const {
				result: { current: applicationRes },
			} = renderHook(() => useApplication('randomId', 'randomId'));

			expect(applicationRes).toBeUndefined();
		});

		it('deletes project application', async () => {
			const {
				result: { current: setProjects },
			} = renderHook(useSetProjects);
			const projects = await ProjectFactory.batch(1);
			setProjects(projects);

			const {
				result: { current: setProjectApplications },
			} = renderHook(useSetProjectApplications);
			const applications = await ApplicationFactory.batch(1);
			setProjectApplications(projects[0].id, applications);

			const {
				result: { current: deleteApplication },
			} = renderHook(useDeleteApplication);
			deleteApplication(projects[0].id, applications[0].id);

			const {
				result: { current: application },
			} = renderHook(() =>
				useApplication(projects[0].id, applications[0].id),
			);
			expect(application).toBeUndefined();
		});

		it('deletes non existing project application', async () => {
			const {
				result: { current: setProjects },
			} = renderHook(useSetProjects);
			const projects = await ProjectFactory.batch(1);
			setProjects(projects);

			const {
				result: { current: setProjectApplications },
			} = renderHook(useSetProjectApplications);
			const applications = await ApplicationFactory.batch(1);
			setProjectApplications(projects[0].id, applications);

			const {
				result: { current: deleteApplication },
			} = renderHook(useDeleteApplication);
			deleteApplication('randomId', applications[0].id);

			const {
				result: { current: application },
			} = renderHook(() =>
				useApplication(projects[0].id, applications[0].id),
			);
			expect(application).toBe(applications[0]);
		});

		it('updates project application', async () => {
			const {
				result: { current: setProjects },
			} = renderHook(useSetProjects);
			const projects = await ProjectFactory.batch(1);
			setProjects(projects);

			const {
				result: { current: setProjectApplications },
			} = renderHook(useSetProjectApplications);
			const applications = await ApplicationFactory.batch(1);
			setProjectApplications(projects[0].id, applications);

			const {
				result: { current: updateApplication },
			} = renderHook(useUpdateApplication);
			const modifiedApplication = {
				...applications[0],
				name: 'newName',
			};
			updateApplication(
				projects[0].id,
				applications[0].id,
				modifiedApplication,
			);

			const {
				result: { current: application },
			} = renderHook(() =>
				useApplication(projects[0].id, applications[0].id),
			);
			expect(application).toStrictEqual(modifiedApplication);
		});

		it('updates non existing project application', async () => {
			const {
				result: { current: setProjects },
			} = renderHook(useSetProjects);
			const projects = await ProjectFactory.batch(1);
			setProjects(projects);

			const {
				result: { current: setProjectApplications },
			} = renderHook(useSetProjectApplications);
			const applications = await ApplicationFactory.batch(1);
			setProjectApplications(projects[0].id, applications);

			const {
				result: { current: updateApplication },
			} = renderHook(useUpdateApplication);
			const modifiedApplication = {
				...applications[0],
				name: 'newName',
			};
			updateApplication(
				'randomId',
				applications[0].id,
				modifiedApplication,
			);

			const {
				result: { current: application },
			} = renderHook(() =>
				useApplication(projects[0].id, applications[0].id),
			);
			expect(application).toStrictEqual(applications[0]);
		});
	});

	describe('getPromptConfig and setPromptConfig', () => {
		it('sets and gets prompt config', async () => {
			const applicationId = '1';
			const {
				result: { current: setPromptConfig },
			} = renderHook(useSetPromptConfig);
			const promptConfigs = await PromptConfigFactory.batch(2);
			setPromptConfig(applicationId, promptConfigs);

			const {
				result: { current: getPromptConfig },
			} = renderHook(usePromptConfig);

			const config = getPromptConfig[applicationId];

			expect(config).toEqual(promptConfigs);
		});
	});

	describe('getAPIKeys and setAPIKeys', () => {
		it('sets and gets API keys', async () => {
			const {
				result: { current: setAPIKeys },
			} = renderHook(useSetAPIKeys);
			const apiKeys = await APIKeyFactory.batch(2);

			const applicationId = '1';
			setAPIKeys(applicationId, apiKeys);

			const {
				result: { current: apiKeysRes },
			} = renderHook(() => useAPIKeys(applicationId));

			expect(apiKeysRes).toBe(apiKeys);
		});
	});

	describe('setProjectUsers, addProjectUser, updateProjectUser and removeProjectUser', () => {
		const projectId = '1';

		it('sets project users', () => {
			const projectUsers = ProjectUserAccountFactory.batchSync(2);
			const {
				result: { current: setProjectUsers },
			} = renderHook(useSetProjectUsers);
			setProjectUsers(projectId, projectUsers);

			const {
				result: { current: currentUsers },
			} = renderHook(() => useProjectUsers(projectId));

			expect(currentUsers).toBe(projectUsers);
		});

		it('adds a new project user', () => {
			const {
				result: { current: setProjectUsers },
			} = renderHook(useSetProjectUsers);
			setProjectUsers(projectId, []);

			const projectUser = ProjectUserAccountFactory.buildSync();
			const {
				result: { current: addProjectUser },
			} = renderHook(useAddProjectUser);
			addProjectUser(projectId, projectUser);

			const {
				result: { current: currentUsers },
			} = renderHook(() => useProjectUsers(projectId));

			expect(currentUsers).toStrictEqual([projectUser]);
		});
		it('ignores adding an existing user', () => {
			const projectUser = ProjectUserAccountFactory.buildSync();
			const {
				result: { current: setProjectUsers },
			} = renderHook(useSetProjectUsers);
			setProjectUsers(projectId, [projectUser]);

			const {
				result: { current: addProjectUser },
			} = renderHook(useAddProjectUser);
			addProjectUser(projectId, projectUser);

			const {
				result: { current: currentUsers },
			} = renderHook(() => useProjectUsers(projectId));

			expect(currentUsers).toStrictEqual([projectUser]);
		});

		it('updates an existing project user', () => {
			const projectUser = ProjectUserAccountFactory.buildSync();
			const {
				result: { current: setProjectUsers },
			} = renderHook(useSetProjectUsers);
			setProjectUsers(projectId, [projectUser]);

			const updatedUser = { ...projectUser, name: 'New Name' };
			const {
				result: { current: updateProjectUser },
			} = renderHook(useUpdateProjectUser);
			updateProjectUser(projectId, updatedUser);

			const {
				result: { current: currentUsers },
			} = renderHook(() => useProjectUsers(projectId));

			expect(currentUsers).toStrictEqual([updatedUser]);
		});

		it('does not update a non existing project user', () => {
			const projectUser = ProjectUserAccountFactory.buildSync();
			const {
				result: { current: setProjectUsers },
			} = renderHook(useSetProjectUsers);
			setProjectUsers(projectId, [projectUser]);

			const updatedUser = { ...projectUser, name: 'New Name' };
			const {
				result: { current: updateProjectUser },
			} = renderHook(useUpdateProjectUser);
			updateProjectUser('randomId', updatedUser);

			const {
				result: { current: currentUsers },
			} = renderHook(() => useProjectUsers(projectId));

			expect(currentUsers).toStrictEqual([projectUser]);
		});

		it('removes a project user', () => {
			const projectUser = ProjectUserAccountFactory.buildSync();
			const {
				result: { current: setProjectUsers },
			} = renderHook(useSetProjectUsers);
			setProjectUsers(projectId, [projectUser]);

			const {
				result: { current: removeProjectUser },
			} = renderHook(useRemoveProjectUser);
			removeProjectUser(projectId, projectUser.id);

			const {
				result: { current: currentUsers },
			} = renderHook(() => useProjectUsers(projectId));

			expect(currentUsers).toStrictEqual([]);
		});

		it('does not remove a non existent project user', () => {
			const projectUser = ProjectUserAccountFactory.buildSync();
			const {
				result: { current: setProjectUsers },
			} = renderHook(useSetProjectUsers);
			setProjectUsers(projectId, [projectUser]);

			const {
				result: { current: removeProjectUser },
			} = renderHook(useRemoveProjectUser);
			removeProjectUser('randomId', projectUser.id);

			const {
				result: { current: currentUsers },
			} = renderHook(() => useProjectUsers(projectId));

			expect(currentUsers).toStrictEqual([projectUser]);
		});
	});
});

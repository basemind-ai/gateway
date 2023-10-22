import {
	ApplicationFactory,
	ProjectFactory,
	PromptConfigFactory,
	TokenFactory,
} from 'tests/factories';
import { renderHook } from 'tests/test-utils';
import { beforeEach, describe, expect } from 'vitest';

import {
	projectStoreStateCreator,
	useAddProject,
	useCurrentProject,
	useDeleteApplication,
	useGetApplication,
	useGetApplications,
	useGetPromptConfig,
	useGetTokens,
	useProject,
	useSetCurrentProject,
	useSetProjectApplications,
	useSetProjects,
	useSetPromptConfig,
	useSetTokens,
	useUpdateApplication,
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

	describe('setProjects, useProject and addProject', () => {
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
				result: { current: storedProjects },
			} = renderHook(() => useProject(project.id));

			expect(storedProjects).toEqual(project);
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
				result: { current: getCurrentProject },
			} = renderHook(useCurrentProject);

			const currentProject = getCurrentProject();
			expect(currentProject).toEqual(projects[0]);
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
				result: { current: applicationMap },
			} = renderHook(useGetApplications);

			expect(applicationMap[projects[0].id]).toEqual(applications);
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
				useGetApplication(projects[0].id, applications[0].id),
			);
			expect(application).toBeUndefined();
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
				useGetApplication(projects[0].id, applications[0].id),
			);
			expect(application).toStrictEqual(modifiedApplication);
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
			} = renderHook(useGetPromptConfig);

			const config = getPromptConfig[applicationId];

			expect(config).toEqual(promptConfigs);
		});
	});

	describe('getTokens and setTokens', () => {
		it('sets and gets tokens', async () => {
			const {
				result: { current: setTokens },
			} = renderHook(useSetTokens);
			const tokens = await TokenFactory.batch(2);

			const applicationId = '1';
			setTokens(applicationId, tokens);

			const {
				result: { current: tokenRes },
			} = renderHook(() => useGetTokens(applicationId));

			expect(tokenRes).toBe(tokens);
		});
	});
});

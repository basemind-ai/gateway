import { ApplicationFactory, ProjectFactory } from 'tests/factories';
import { renderHook } from 'tests/test-utils';
import { beforeEach, expect } from 'vitest';

import {
	projectStoreStateCreator,
	useAddProject,
	useCurrentProject,
	useGetApplication,
	useProject,
	useSetCurrentProject,
	useSetProjectApplications,
	useSetProjects,
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

	describe('setCurrentProject and getCurrentProject', () => {
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

	describe('setProjectApplications and getApplication', () => {
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
				result: { current: getApplication },
			} = renderHook(useGetApplication);

			const application = getApplication(
				projects[0].id,
				applications[0].id,
			);
			expect(application).toEqual(applications[0]);
		});
	});
});

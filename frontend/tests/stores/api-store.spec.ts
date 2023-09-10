import { ProjectFactory, UserFactory } from 'tests/factories';
import { renderHook } from 'tests/test-utils';
import { beforeEach, expect } from 'vitest';

import {
	apiStoreStateCreator,
	useProject,
	useSetProjects,
	useSetUser,
	useUser,
} from '@/stores/api-store';

describe('api-store tests', () => {
	describe('apiStoreStateCreator', () => {
		const set = vi.fn();
		const get = vi.fn();

		beforeEach(() => {
			vi.resetAllMocks();
		});

		it('sets user', async () => {
			const store = apiStoreStateCreator(set, get, {} as any);
			const user = await UserFactory.build();
			store.setUser(user);
			expect(set).toHaveBeenCalledWith({ user });
		});

		it('sets projects', async () => {
			const store = apiStoreStateCreator(set, get, {} as any);
			const projects = await ProjectFactory.batch(1);
			store.setProjects(projects);
			expect(set).toHaveBeenCalledWith({ projects });
		});
	});

	describe('setUser and useUser', () => {
		it('sets and returns user', async () => {
			const {
				result: { current: setUser },
			} = renderHook(useSetUser);

			const user = await UserFactory.build();
			setUser(user);

			const {
				result: { current: storedUser },
			} = renderHook(useUser);

			expect(storedUser).toEqual(user);
		});
	});

	describe('setProjects and useProject', () => {
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
	});
});

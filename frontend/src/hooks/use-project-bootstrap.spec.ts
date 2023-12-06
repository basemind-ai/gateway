import { waitFor } from '@testing-library/react';
import { ApplicationFactory, ProjectFactory } from 'tests/factories';
import { mockFetch, routerReplaceMock } from 'tests/mocks';
import { act, renderHook } from 'tests/test-utils';

import { Navigation } from '@/constants';
import { useProjectBootstrap } from '@/hooks/use-project-bootstrap';
import { useResetState, useSetProjects } from '@/stores/api-store';

describe('useProjectBootstrap tests', () => {
	const projects = ProjectFactory.batchSync(2);
	const applications = ApplicationFactory.batchSync(2);

	const {
		result: { current: resetState },
	} = renderHook(useResetState);
	const {
		result: { current: setProjects },
	} = renderHook(useSetProjects);

	beforeEach(() => {
		resetState();
	});

	it('should not do anything if there are already projects in the store', async () => {
		act(() => {
			setProjects(projects);
		});

		renderHook(useProjectBootstrap);
		expect(routerReplaceMock).not.toHaveBeenCalled();
	});

	it('should navigate to project create screen, when no projects are returned', async () => {
		mockFetch.mockResolvedValueOnce({
			json: () => Promise.resolve([]),
			ok: true,
		});

		const { rerender } = renderHook(useProjectBootstrap);

		rerender(useProjectBootstrap);

		await waitFor(() => {
			expect(routerReplaceMock).toHaveBeenCalledWith(
				Navigation.CreateProject,
			);
		});
	});

	it('should retrieve projects, application and navigate to project page', async () => {
		let called = false;

		mockFetch.mockImplementation(() => {
			if (called) {
				return {
					json: () => Promise.resolve(applications),
					ok: true,
				};
			} else {
				called = true;

				return {
					json: () => Promise.resolve(projects),
					ok: true,
				};
			}
		});

		const { rerender } = renderHook(useProjectBootstrap);

		rerender(useProjectBootstrap);

		await waitFor(() => {
			expect(routerReplaceMock).toHaveBeenCalledWith(
				`${Navigation.Projects}/${projects[0].id}`,
			);
		});
	});
});

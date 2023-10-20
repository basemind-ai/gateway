import { ApplicationFactory, ProjectFactory } from 'tests/factories';
import { getAuthMock, mockFetch, routerReplaceMock } from 'tests/mocks';
import { act, render, renderHook, screen, waitFor } from 'tests/test-utils';
import { expect } from 'vitest';

import Projects from '@/app/projects/page';
import { Navigation } from '@/constants';
import { useGetApplications, useProjects } from '@/stores/project-store';

describe('projects page tests', () => {
	it('should route to sign in page when user is not present', async () => {
		getAuthMock.mockImplementationOnce(() => ({
			setPersistence: vi.fn(),
			currentUser: null,
		}));
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve([]),
		});
		render(<Projects />);
		await waitFor(() => {
			expect(routerReplaceMock).toHaveBeenCalledWith(Navigation.SignIn);
		});
	});

	it('navigate to project id overview when user has one project', async () => {
		const projects = await ProjectFactory.batch(1);
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(projects),
		});
		render(<Projects />);
		await waitFor(() => {
			expect(routerReplaceMock).toHaveBeenCalledWith(
				`${Navigation.Projects}/${projects[0].id}/dashboard`,
			);
		});
	});

	it('navigate to create project when user has no projects', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve([]),
		});
		render(<Projects />);
		await waitFor(() => {
			expect(routerReplaceMock).toHaveBeenCalledWith(
				Navigation.CreateProject,
			);
		});
	});

	it('renders loading state before projects are retrieved', () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve([]),
		});
		render(<Projects />);
		const projectsViewLoading = screen.getByTestId('projects-view-loading');
		expect(projectsViewLoading).toBeInTheDocument();
	});

	it('rendering projects component change store value', async () => {
		const projects = await ProjectFactory.batch(3);
		const applications = await ApplicationFactory.batch(2);
		const { result } = renderHook(() => useProjects());
		const { result: applicationsResult } = renderHook(() =>
			useGetApplications(),
		);
		act(() => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(projects),
			});
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(applications),
			});
		});

		render(<Projects />);
		await waitFor(() => {
			expect(result.current).toEqual(projects);
		});
		expect(applicationsResult.current[projects[0].id]).toEqual(
			applications,
		);
	});
});

import { ApplicationFactory, ProjectFactory } from 'tests/factories';
import { getAuthMock, mockFetch, routerReplaceMock } from 'tests/mocks';
import { act, render, renderHook, screen, waitFor } from 'tests/test-utils';

import Projects from '@/app/projects/page';
import { Navigation } from '@/constants';
import {
	useApplications,
	useProjects,
	useSetProjects,
} from '@/stores/api-store';

describe('projects page tests', () => {
	it('should route to sign in page when user is not present', async () => {
		getAuthMock.mockImplementationOnce(() => ({
			currentUser: null,
			setPersistence: vi.fn(),
		}));
		mockFetch.mockResolvedValueOnce({
			json: () => Promise.resolve([]),
			ok: true,
		});
		render(<Projects />);
		await waitFor(() => {
			expect(routerReplaceMock).toHaveBeenCalledWith(Navigation.SignIn);
		});
	});

	it('navigate to project id overview when user has one project', async () => {
		const projects = await ProjectFactory.batch(1);
		mockFetch.mockResolvedValueOnce({
			json: () => Promise.resolve(projects),
			ok: true,
		});
		mockFetch.mockResolvedValueOnce({
			json: () => Promise.resolve([]),
			ok: true,
		});
		const { result: setProjects } = renderHook(() => useSetProjects());
		setProjects.current([]);

		render(<Projects />);
		await waitFor(() => {
			expect(routerReplaceMock).toHaveBeenCalledWith(
				`${Navigation.Projects}/${projects[0].id}`,
			);
		});
	});

	it('navigate to create project when user has no projects', async () => {
		mockFetch.mockResolvedValueOnce({
			json: () => Promise.resolve([]),
			ok: true,
		});
		const { result: setProjects } = renderHook(() => useSetProjects());
		setProjects.current([]);

		render(<Projects />);
		await waitFor(() => {
			expect(routerReplaceMock).toHaveBeenCalledWith(
				Navigation.CreateProject,
			);
		});
	});

	it('renders loading state before projects are retrieved', () => {
		mockFetch.mockResolvedValueOnce({
			json: () => Promise.resolve([]),
			ok: true,
		});
		const { result: setProjects } = renderHook(() => useSetProjects());
		setProjects.current([]);
		render(<Projects />);
		const projectsViewLoading = screen.getByTestId('projects-view-loading');
		expect(projectsViewLoading).toBeInTheDocument();
	});

	it('rendering projects component change store value', async () => {
		const { result: setProjects } = renderHook(() => useSetProjects());
		setProjects.current([]);

		const projects = await ProjectFactory.batch(3);
		const applications = await ApplicationFactory.batch(2);
		const { result } = renderHook(() => useProjects());
		const { result: applicationsResult } = renderHook(() =>
			useApplications(projects[0].id),
		);
		act(() => {
			mockFetch.mockResolvedValueOnce({
				json: () => Promise.resolve(projects),
				ok: true,
			});
			mockFetch.mockResolvedValueOnce({
				json: () => Promise.resolve(applications),
				ok: true,
			});
		});

		render(<Projects />);
		await waitFor(() => {
			expect(result.current).toEqual(projects);
		});
		expect(applicationsResult.current).toEqual(applications);
	});
});

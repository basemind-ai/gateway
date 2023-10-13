import { ProjectFactory } from 'tests/factories';
import { getAuthMock, mockFetch, routerReplaceMock } from 'tests/mocks';
import { render, renderHook, screen, waitFor } from 'tests/test-utils';
import { expect } from 'vitest';

import Projects from '@/app/projects/page';
import { Navigation } from '@/constants';
import { useProjects } from '@/stores/api-store';

describe('projects page tests', () => {
	mockFetch.mockResolvedValueOnce({
		ok: true,
		json: () => Promise.resolve([]),
	});
	it('should route to sign in page when user is not present', async () => {
		getAuthMock.mockImplementationOnce(() => ({
			setPersistence: vi.fn(),
			currentUser: null,
		}));
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
				`${Navigation.Projects}/${projects[0].id}`,
			);
		});
	});

	it('navigate to project who was updated last', async () => {
		const projects = await ProjectFactory.batch(3);
		projects.sort(
			(a, b) =>
				new Date(a.updatedAt).getTime() -
				new Date(b.updatedAt).getTime(),
		);
		const oldestId = projects[0].id;
		const newestId = projects[2].id;
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(projects),
		});
		render(<Projects />);
		await waitFor(() => {
			expect(routerReplaceMock).toHaveBeenCalledWith(
				`${Navigation.Projects}/${newestId}`,
			);
		});
		expect(routerReplaceMock).not.toHaveBeenCalledWith(
			`${Navigation.Projects}/${oldestId}`,
		);
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
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(projects),
		});
		const { result } = renderHook(() => useProjects());
		expect(result.current).toEqual([]);
		render(<Projects />);
		await waitFor(() => {
			expect(result.current).toEqual(projects);
		});
	});
});

import { fireEvent } from '@testing-library/react';
import { ProjectFactory } from 'tests/factories';
import {
	render,
	renderHook,
	routerReplaceMock,
	screen,
} from 'tests/test-utils';
import { describe } from 'vitest';

import * as projectsAPI from '@/api/projects-api';
import CreateProjectPage from '@/app/projects/create/page';
import { Navigation } from '@/constants';
import { useSetProjects } from '@/stores/api-store';

describe('ProjectCreatePage', () => {
	it('should render without crashing', () => {
		render(<CreateProjectPage />);
		const projectsViewSetup = screen.getByTestId(
			'create-projects-container',
		);
		expect(projectsViewSetup).toBeInTheDocument();
	});

	it('disables submit when name is empty', () => {
		render(<CreateProjectPage />);
		const submitButton = screen.getByTestId('create-project-submit-button');
		expect(submitButton).toBeDisabled();
	});

	it('submit is enable when name has value', () => {
		render(<CreateProjectPage />);
		const submitButton = screen.getByTestId('create-project-submit-button');
		const nameInput = screen.getByTestId('create-project-name-input');
		expect(submitButton).toBeDisabled();
		fireEvent.change(nameInput, { target: { value: 'test' } });
		expect(submitButton).toBeEnabled();
	});

	it('submit calls handleCreateProject', async () => {
		const handleCreateProjectSpy = vi.spyOn(
			projectsAPI,
			'handleCreateProject',
		);

		handleCreateProjectSpy.mockResolvedValueOnce(
			await ProjectFactory.build(),
		);
		const projects = await ProjectFactory.batch(1);
		const { result } = renderHook(() => useSetProjects());

		result.current(projects);
		render(<CreateProjectPage />);
		const submitButton = screen.getByTestId('create-project-submit-button');
		const nameInput = screen.getByTestId('create-project-name-input');
		fireEvent.change(nameInput, { target: { value: 'test' } });
		fireEvent.click(submitButton);
		expect(handleCreateProjectSpy).toHaveBeenCalled();
	});

	it('submit shows loading spinner then remove', async () => {
		render(<CreateProjectPage />);
		const submitButton = screen.getByTestId('create-project-submit-button');
		const nameInput = screen.getByTestId('create-project-name-input');
		fireEvent.change(nameInput, { target: { value: 'test' } });
		fireEvent.click(submitButton);
		const loadingSpinner = screen.getByTestId(
			'create-project-loading-spinner',
		);
		expect(loadingSpinner).toBeInTheDocument();
		await vi.waitFor(() => {
			expect(loadingSpinner).not.toBeInTheDocument();
		});
	});

	it('cancel should be rendered when there are projects', async () => {
		const projects = await ProjectFactory.batch(1);
		const { result } = renderHook(() => useSetProjects());
		result.current(projects);
		render(<CreateProjectPage />);
		const cancelButton = screen.getByTestId('create-project-cancel-button');
		expect(cancelButton).toBeInTheDocument();
	});

	it('cancel should not be rendered when there are no projects', async () => {
		const { result } = renderHook(() => useSetProjects());
		result.current([]);
		render(<CreateProjectPage />);
		const cancelButton = screen.queryByTestId(
			'create-project-cancel-button',
		);
		expect(cancelButton).not.toBeInTheDocument();
	});

	it('cancel should navigate to project id overview', async () => {
		const projects = await ProjectFactory.batch(1);
		const { result } = renderHook(() => useSetProjects());
		result.current(projects);
		render(<CreateProjectPage />);
		const cancelButton = screen.getByTestId('create-project-cancel-button');
		expect(cancelButton).toBeInTheDocument();
		fireEvent.click(cancelButton);
		expect(routerReplaceMock).toHaveBeenCalledWith(
			`${Navigation.Projects}/${projects[0].id}`,
		);
	});

	it('handle submit error should render error comment', async () => {
		const handleCreateProjectSpy = vi.spyOn(
			projectsAPI,
			'handleCreateProject',
		);
		handleCreateProjectSpy.mockRejectedValueOnce(new Error('test'));
		render(<CreateProjectPage />);
		const submitButton = screen.getByTestId('create-project-submit-button');
		const nameInput = screen.getByTestId('create-project-name-input');
		fireEvent.change(nameInput, { target: { value: 'test' } });
		fireEvent.click(submitButton);
		await vi.waitFor(() => {
			const errorView = screen.getByTestId(
				'create-project-error-comment',
			);
			expect(errorView).toBeInTheDocument();
		});
	});

	it('navigate to new project after creation', async () => {
		const handleCreateProjectSpy = vi.spyOn(
			projectsAPI,
			'handleCreateProject',
		);
		const newProject = await ProjectFactory.build();
		handleCreateProjectSpy.mockResolvedValueOnce(newProject);
		render(<CreateProjectPage />);
		const submitButton = screen.getByTestId('create-project-submit-button');
		const nameInput = screen.getByTestId('create-project-name-input');
		fireEvent.change(nameInput, { target: { value: 'test' } });
		fireEvent.click(submitButton);
		await vi.waitFor(() => {
			expect(routerReplaceMock).toHaveBeenCalledWith(
				`${Navigation.Projects}/${newProject.id}`,
			);
		});
	});
});

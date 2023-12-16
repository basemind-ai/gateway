import { ApplicationFactory, ProjectFactory } from 'tests/factories';
import { mockPage, mockReady, mockTrack, routerReplaceMock } from 'tests/mocks';
import {
	fireEvent,
	render,
	renderHook,
	screen,
	waitFor,
} from 'tests/test-utils';

import * as applicationsAPI from '@/api/applications-api';
import * as projectsAPI from '@/api/projects-api';
import CreateProjectPage from '@/app/[locale]/projects/create/page';
import { Navigation } from '@/constants';
import { ApiError } from '@/errors';
import { useSetProjects } from '@/stores/api-store';
import { setRouteParams } from '@/utils/navigation';

describe('ProjectCreatePage', () => {
	it('should render without crashing', () => {
		render(<CreateProjectPage />);
		const projectsViewSetup = screen.getByTestId(
			'create-projects-container',
		);
		expect(projectsViewSetup).toBeInTheDocument();
	});

	it('disables submit on start', () => {
		render(<CreateProjectPage />);
		const submitButton = screen.getByTestId('create-project-submit-button');
		expect(submitButton).toBeDisabled();
	});

	it('submit is enable when projectName and application has value', () => {
		render(<CreateProjectPage />);
		const submitButton = screen.getByTestId('create-project-submit-button');
		const projectNameInput = screen.getByTestId(
			'create-project-name-input',
		);
		expect(submitButton).toBeDisabled();
		fireEvent.change(projectNameInput, { target: { value: 'test' } });
		expect(submitButton).toBeDisabled();
		const applicationNameInput = screen.getByTestId(
			'create-application-name-input',
		);
		fireEvent.change(applicationNameInput, {
			target: { value: 'test_app' },
		});
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
		const applicationNameInput = screen.getByTestId(
			'create-application-name-input',
		);
		fireEvent.change(applicationNameInput, {
			target: { value: 'test_app' },
		});
		fireEvent.click(submitButton);
		expect(handleCreateProjectSpy).toHaveBeenCalled();
	});

	it('submit calls handleCreateApplications', async () => {
		const handleCreateProjectSpy = vi.spyOn(
			projectsAPI,
			'handleCreateProject',
		);

		handleCreateProjectSpy.mockResolvedValueOnce(
			await ProjectFactory.build(),
		);
		const handleCreateApplicationSpy = vi.spyOn(
			applicationsAPI,
			'handleCreateApplication',
		);

		handleCreateApplicationSpy.mockResolvedValueOnce(
			await ApplicationFactory.build(),
		);
		const projects = await ProjectFactory.batch(1);
		const { result } = renderHook(() => useSetProjects());

		result.current(projects);
		render(<CreateProjectPage />);
		const submitButton = screen.getByTestId('create-project-submit-button');
		const nameInput = screen.getByTestId('create-project-name-input');
		fireEvent.change(nameInput, { target: { value: 'test' } });
		const applicationNameInput = screen.getByTestId(
			'create-application-name-input',
		);
		fireEvent.change(applicationNameInput, {
			target: { value: 'test_app' },
		});
		fireEvent.click(submitButton);
		await waitFor(() => {
			expect(handleCreateApplicationSpy).toHaveBeenCalled();
		});
	});

	it('submit shows loading spinner then remove', async () => {
		render(<CreateProjectPage />);
		const submitButton = screen.getByTestId('create-project-submit-button');
		const nameInput = screen.getByTestId('create-project-name-input');
		fireEvent.change(nameInput, { target: { value: 'test' } });
		const applicationNameInput = screen.getByTestId(
			'create-application-name-input',
		);
		fireEvent.change(applicationNameInput, {
			target: { value: 'test_app' },
		});
		fireEvent.click(submitButton);
		const loadingSpinner = screen.getByTestId(
			'create-project-loading-spinner',
		);
		expect(loadingSpinner).toBeInTheDocument();
		await waitFor(() => {
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

	it('cancel should not be rendered when there are no projects', () => {
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
		handleCreateProjectSpy.mockRejectedValueOnce(
			new ApiError('failed', {
				context: {},
				statusCode: 500,
				statusText: 'failed',
			}),
		);
		render(<CreateProjectPage />);
		const submitButton = screen.getByTestId('create-project-submit-button');
		const nameInput = screen.getByTestId('create-project-name-input');
		fireEvent.change(nameInput, { target: { value: 'test' } });
		const applicationNameInput = screen.getByTestId(
			'create-application-name-input',
		);
		fireEvent.change(applicationNameInput, {
			target: { value: 'test_app' },
		});
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
		const handleCreateApplicationSpy = vi.spyOn(
			applicationsAPI,
			'handleCreateApplication',
		);
		const newApplication = await ApplicationFactory.build();
		handleCreateApplicationSpy.mockResolvedValueOnce(newApplication);
		render(<CreateProjectPage />);
		const submitButton = screen.getByTestId('create-project-submit-button');
		const nameInput = screen.getByTestId('create-project-name-input');
		fireEvent.change(nameInput, { target: { value: 'test' } });
		const applicationNameInput = screen.getByTestId(
			'create-application-name-input',
		);
		fireEvent.change(applicationNameInput, {
			target: { value: 'test_app' },
		});
		fireEvent.click(submitButton);
		await vi.waitFor(() => {
			expect(routerReplaceMock).toHaveBeenCalledWith(
				setRouteParams(Navigation.ConfigCreateWizard, {
					applicationId: newApplication.id,
					projectId: newProject.id,
				}),
			);
		});
	});

	it('calls page track', async () => {
		render(<CreateProjectPage />);
		await waitFor(() => {
			expect(mockReady).toHaveBeenCalled();
		});
		await waitFor(() => {
			expect(mockPage).toHaveBeenCalledWith(
				'create_project',
				expect.any(Object),
			);
		});
	});

	it('calls track after successful project creation', async () => {
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
		const applicationNameInput = screen.getByTestId(
			'create-application-name-input',
		);
		fireEvent.change(applicationNameInput, {
			target: { value: 'test_app' },
		});
		fireEvent.click(submitButton);
		await vi.waitFor(() => {
			expect(mockTrack).toHaveBeenCalledWith(
				'created_project',
				newProject,
			);
		});
	});

	it('calls track after successful application creation', async () => {
		const handleCreateProjectSpy = vi.spyOn(
			projectsAPI,
			'handleCreateProject',
		);
		const newProject = await ProjectFactory.build();
		handleCreateProjectSpy.mockResolvedValueOnce(newProject);
		const handleCreateApplicationSpy = vi.spyOn(
			applicationsAPI,
			'handleCreateApplication',
		);
		const newApplication = await ApplicationFactory.build();
		handleCreateApplicationSpy.mockResolvedValueOnce(newApplication);
		render(<CreateProjectPage />);
		const submitButton = screen.getByTestId('create-project-submit-button');
		const nameInput = screen.getByTestId('create-project-name-input');
		fireEvent.change(nameInput, { target: { value: 'test' } });
		const applicationNameInput = screen.getByTestId(
			'create-application-name-input',
		);
		fireEvent.change(applicationNameInput, {
			target: { value: 'test_app' },
		});
		fireEvent.click(submitButton);
		await vi.waitFor(() => {
			expect(mockTrack).toHaveBeenCalledWith(
				'created_application',
				newApplication,
			);
		});
	});
});

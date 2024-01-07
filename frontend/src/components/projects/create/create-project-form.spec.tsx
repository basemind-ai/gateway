import { ApplicationFactory, ProjectFactory } from 'tests/factories';
import { mockTrack, routerReplaceMock } from 'tests/mocks';
import { fireEvent, render, screen, waitFor } from 'tests/test-utils';
import { expect, MockInstance } from 'vitest';

import * as applicationsAPI from '@/api/applications-api';
import * as projectsAPI from '@/api/projects-api';
import { CreateProjectForm } from '@/components/projects/create/create-project-form';
import { Navigation } from '@/constants';
import { ApiError } from '@/errors';
import { setRouteParams } from '@/utils/navigation';

describe('CreateProjectForm tests', () => {
	const project = ProjectFactory.buildSync();
	const application = ApplicationFactory.buildSync();

	let createProjectSpy: MockInstance;
	let createApplicationSpy: MockInstance;

	beforeEach(() => {
		createProjectSpy = vi.spyOn(projectsAPI, 'handleCreateProject');
		createProjectSpy.mockResolvedValue(project);

		createApplicationSpy = vi.spyOn(
			applicationsAPI,
			'handleCreateApplication',
		);
		createApplicationSpy.mockResolvedValue(application);
	});

	it('submit calls handleCreateProject and handleCreateApplication', async () => {
		const { rerender } = render(
			<CreateProjectForm
				handleCancel={vi.fn()}
				allowCancel={false}
				validateApplicationName={() => true}
				validateProjectName={() => true}
				isLoading={false}
				setLoading={vi.fn()}
			/>,
		);
		const submitButton = screen.getByTestId('create-project-submit-button');
		expect(submitButton).toBeDisabled();

		const projectNameInput = screen.getByTestId(
			'create-project-name-input',
		);
		fireEvent.change(projectNameInput, {
			target: { value: 'testProject' },
		});

		const applicationNameInput = screen.getByTestId(
			'create-application-name-input',
		);
		fireEvent.change(applicationNameInput, {
			target: { value: 'testApplication' },
		});

		rerender(
			<CreateProjectForm
				handleCancel={vi.fn()}
				allowCancel={false}
				validateApplicationName={() => true}
				validateProjectName={() => true}
				isLoading={false}
				setLoading={vi.fn()}
			/>,
		);

		expect(submitButton).toBeEnabled();
		fireEvent.click(submitButton);

		await waitFor(() => {
			expect(createProjectSpy).toHaveBeenCalledWith({
				data: { name: 'testProject' },
			});
		});

		expect(createApplicationSpy).toHaveBeenCalledWith({
			data: { name: 'testApplication' },
			projectId: project.id,
		});
	});

	it('handle submit error should show the error toast', async () => {
		createProjectSpy.mockRejectedValueOnce(
			new ApiError('failed', {
				context: {},
				statusCode: 500,
				statusText: 'failed',
			}),
		);
		render(
			<CreateProjectForm
				handleCancel={vi.fn()}
				allowCancel={false}
				isLoading={false}
				setLoading={vi.fn()}
				validateApplicationName={() => true}
				validateProjectName={() => true}
			/>,
		);
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
			const toastMessage = screen.getByTestId('toast-message');
			expect(toastMessage).toHaveTextContent('failed');
		});
	});

	it('navigates to the new project after creation', async () => {
		render(
			<CreateProjectForm
				handleCancel={vi.fn()}
				isLoading={false}
				setLoading={vi.fn()}
				allowCancel={false}
				validateApplicationName={() => true}
				validateProjectName={() => true}
			/>,
		);
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
			expect(routerReplaceMock).toHaveBeenCalledWith(
				setRouteParams(Navigation.ConfigCreateWizard, {
					applicationId: application.id,
					projectId: project.id,
				}),
			);
		});
	});

	it('calls track after successful project creation', async () => {
		render(
			<CreateProjectForm
				handleCancel={vi.fn()}
				allowCancel={false}
				isLoading={false}
				setLoading={vi.fn()}
				validateApplicationName={() => true}
				validateProjectName={() => true}
			/>,
		);
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
			expect(mockTrack).toHaveBeenCalledWith(
				'createdProject',
				expect.any(Object),
			);
		});
	});

	it('calls track after successful application creation', async () => {
		render(
			<CreateProjectForm
				handleCancel={vi.fn()}
				allowCancel={false}
				isLoading={false}
				setLoading={vi.fn()}
				validateApplicationName={() => true}
				validateProjectName={() => true}
			/>,
		);
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
				'createdApplication',
				expect.any(Object),
			);
		});
	});

	it('should validate project and application names on input', () => {
		// Arrange
		const handleCancel = vi.fn();
		const allowCancel = true;
		const validateProjectName = vi.fn().mockReturnValue(true);
		const validateApplicationName = vi.fn().mockReturnValue(true);

		render(
			<CreateProjectForm
				handleCancel={handleCancel}
				allowCancel={allowCancel}
				isLoading={false}
				setLoading={vi.fn()}
				validateProjectName={validateProjectName}
				validateApplicationName={validateApplicationName}
			/>,
		);

		// Act
		const projectNameInput = screen.getByTestId(
			'create-project-name-input',
		);
		const applicationNameInput = screen.getByTestId(
			'create-application-name-input',
		);

		fireEvent.change(projectNameInput, {
			target: { value: 'Project Name' },
		});
		fireEvent.change(applicationNameInput, {
			target: { value: 'Application Name' },
		});

		// Assert
		expect(validateProjectName).toHaveBeenCalledWith('Project Name');
		expect(validateApplicationName).toHaveBeenCalledWith(
			'Application Name',
		);
	});

	it('should disable submit button if project or application name is invalid', () => {
		// Arrange
		const handleCancel = vi.fn();
		const allowCancel = true;
		const validateProjectName = vi.fn().mockReturnValue(false);
		const validateApplicationName = vi.fn().mockReturnValue(true);

		render(
			<CreateProjectForm
				handleCancel={handleCancel}
				allowCancel={allowCancel}
				isLoading={false}
				setLoading={vi.fn()}
				validateProjectName={validateProjectName}
				validateApplicationName={validateApplicationName}
			/>,
		);

		// Act
		const submitButton = screen.getByTestId('create-project-submit-button');
		const projectNameInput = screen.getByTestId(
			'create-project-name-input',
		);
		const applicationNameInput = screen.getByTestId(
			'create-application-name-input',
		);

		fireEvent.change(projectNameInput, {
			target: { value: 'Project Name' },
		});
		fireEvent.change(applicationNameInput, {
			target: { value: 'Application Name' },
		});

		// Assert
		expect(submitButton).toBeDisabled();
	});

	it('should allow cancel button to be displayed and call handleCancel on click', () => {
		// Arrange
		const handleCancel = vi.fn();
		const allowCancel = true;
		const validateProjectName = vi.fn();
		const validateApplicationName = vi.fn();

		render(
			<CreateProjectForm
				handleCancel={handleCancel}
				allowCancel={allowCancel}
				isLoading={false}
				setLoading={vi.fn()}
				validateProjectName={validateProjectName}
				validateApplicationName={validateApplicationName}
			/>,
		);

		// Act
		fireEvent.click(screen.getByTestId('create-project-cancel-button'));

		// Assert
		expect(handleCancel).toHaveBeenCalled();
	});
});

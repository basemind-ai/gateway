import { ProjectFactory } from 'tests/factories';
import { mockPage, mockReady, routerReplaceMock } from 'tests/mocks';
import {
	fireEvent,
	render,
	renderHook,
	screen,
	waitFor,
} from 'tests/test-utils';

import CreateProjectPage from '@/app/[locale]/projects/create/page';
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

	it('disables submit on start', () => {
		render(<CreateProjectPage />);
		const submitButton = screen.getByTestId('create-project-submit-button');
		expect(submitButton).toBeDisabled();
	});

	it('submit is enable when both projectName and application have a value', () => {
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
});

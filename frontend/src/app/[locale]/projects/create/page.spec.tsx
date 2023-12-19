import { mockPage, mockReady } from 'tests/mocks';
import { fireEvent, render, screen, waitFor } from 'tests/test-utils';

import CreateProjectPage from '@/app/[locale]/projects/create/page';

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

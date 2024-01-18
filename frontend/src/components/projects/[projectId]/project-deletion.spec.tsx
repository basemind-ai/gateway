import { act } from 'react-dom/test-utils';
import { ProjectFactory } from 'tests/factories';
import {
	fireEvent,
	render,
	renderHook,
	screen,
	waitFor,
} from 'tests/test-utils';

import * as ProjectAPI from '@/api/projects-api';
import { ProjectDeletion } from '@/components/projects/[projectId]/project-deletion';
import { ApiError } from '@/errors';
import { useSetProjects } from '@/stores/api-store';
import { ToastType } from '@/stores/toast-store';

describe('ProjectDeletion', () => {
	const handleDeleteProjectSpy = vi.spyOn(ProjectAPI, 'handleDeleteProject');
	const project = ProjectFactory.buildSync();

	it('renders project deletion', async () => {
		const {
			result: { current: setProjects },
		} = renderHook(useSetProjects);
		act(() => {
			setProjects([project]);
		});

		render(<ProjectDeletion project={project} />);

		const deleteButton = screen.getByTestId('project-delete-btn');
		expect(deleteButton).toBeInTheDocument();
	});

	it('renders confirmation banner and deletes project after entering input', async () => {
		const {
			result: { current: setProjects },
		} = renderHook(useSetProjects);
		act(() => {
			setProjects([project]);
		});
		render(<ProjectDeletion project={project} />);

		const deleteButton = screen.getByTestId('project-delete-btn');
		fireEvent.click(deleteButton);

		const deletionBannerTitle = screen.getByTestId(
			'resource-deletion-title',
		);
		expect(deletionBannerTitle).toBeInTheDocument();

		const deletionInput = screen.getByTestId('resource-deletion-input');
		fireEvent.change(deletionInput, {
			target: { value: project.name },
		});
		const deletionBannerDeleteBtn = screen.getByTestId(
			'resource-deletion-delete-btn',
		);
		fireEvent.click(deletionBannerDeleteBtn);

		await waitFor(() => {
			expect(handleDeleteProjectSpy).toHaveBeenCalledOnce();
		});
	});

	it('shows error when unable to delete project', async () => {
		const {
			result: { current: setProjects },
		} = renderHook(useSetProjects);
		act(() => {
			setProjects([project]);
		});

		render(<ProjectDeletion project={project} />);

		const deleteButton = screen.getByTestId('project-delete-btn');
		fireEvent.click(deleteButton);
		const deletionInput = screen.getByTestId('resource-deletion-input');
		fireEvent.change(deletionInput, {
			target: { value: project.name },
		});

		handleDeleteProjectSpy.mockImplementationOnce(() => {
			throw new ApiError('unable to delete project', {
				statusCode: 401,
				statusText: 'Bad Request',
			});
		});
		const deletionBannerDeleteBtn = screen.getByTestId(
			'resource-deletion-delete-btn',
		);
		fireEvent.click(deletionBannerDeleteBtn);

		const errorToast = screen.getByText('unable to delete project');
		expect(errorToast.className).toContain(ToastType.ERROR);
	});
});

import { ProjectFactory } from 'tests/factories';
import { act, fireEvent, render, renderHook, screen } from 'tests/test-utils';

import * as ProjectAPI from '@/api/projects-api';
import { ProjectGeneralSettings } from '@/components/projects/[projectId]/project-general-settings';
import { ApiError } from '@/errors';
import { useSetProjects } from '@/stores/api-store';
import { ToastType } from '@/stores/toast-store';

describe('ProjectGeneralSettings', () => {
	const handleUpdateProjectSpy = vi.spyOn(ProjectAPI, 'handleUpdateProject');
	const project = ProjectFactory.buildSync();
	const projectId = project.id;

	beforeEach(() => {
		vi.resetAllMocks();
	});

	it('renders project general settings', async () => {
		const {
			result: { current: setProjects },
		} = renderHook(useSetProjects);

		act(() => {
			setProjects([project]);
		});

		render(<ProjectGeneralSettings project={project} />);

		const nameInput =
			screen.getByTestId<HTMLInputElement>('project-name-input');
		expect(nameInput.value).toBe(project.name);

		const descriptionInput = screen.getByTestId<HTMLInputElement>(
			'project-description-input',
		);
		expect(descriptionInput.value).toBe(project.description);

		const saveButton = screen.getByTestId<HTMLButtonElement>(
			'project-setting-save-btn',
		);
		expect(saveButton.disabled).toBe(true);
	});

	it('saves only when fields are changed and valid', async () => {
		const {
			result: { current: setProjects },
		} = renderHook(useSetProjects);
		act(() => {
			setProjects([project]);
		});
		handleUpdateProjectSpy.mockResolvedValueOnce(project);

		render(<ProjectGeneralSettings project={project} />);

		const descriptionInput = screen.getByTestId<HTMLInputElement>(
			'project-description-input',
		);
		const saveButton = screen.getByTestId<HTMLButtonElement>(
			'project-setting-save-btn',
		);

		fireEvent.change(descriptionInput, {
			target: { value: 'new description' },
		});
		fireEvent.click(saveButton);
		expect(handleUpdateProjectSpy).toHaveBeenCalledWith({
			data: {
				description: 'new description',
				name: project.name,
			},
			projectId,
		});
	});

	it('shows error when unable to save settings', async () => {
		const {
			result: { current: setProjects },
		} = renderHook(useSetProjects);
		act(() => {
			setProjects([project]);
		});

		render(<ProjectGeneralSettings project={project} />);

		const descriptionInput = screen.getByTestId<HTMLInputElement>(
			'project-description-input',
		);
		const saveButton = screen.getByTestId<HTMLButtonElement>(
			'project-setting-save-btn',
		);

		handleUpdateProjectSpy.mockImplementationOnce(() => {
			throw new ApiError('unable to save project settings', {
				statusCode: 401,
				statusText: 'Bad Request',
			});
		});
		fireEvent.change(descriptionInput, {
			target: { value: 'new description' },
		});
		fireEvent.click(saveButton);

		const errorToast = screen.getByText('unable to save project settings');
		expect(errorToast.className).toContain(ToastType.ERROR);
	});

	it('does not save when input is not pristine', async () => {
		const {
			result: { current: setProjects },
		} = renderHook(useSetProjects);
		act(() => {
			setProjects([project]);
		});

		render(<ProjectGeneralSettings project={project} />);

		const saveButton = screen.getByTestId<HTMLButtonElement>(
			'project-setting-save-btn',
		);
		fireEvent.click(saveButton);

		expect(handleUpdateProjectSpy).not.toHaveBeenCalled();
	});

	it('does not save when input is changed and reverted to original value', async () => {
		const {
			result: { current: setProjects },
		} = renderHook(useSetProjects);
		act(() => {
			setProjects([project]);
		});

		render(<ProjectGeneralSettings project={project} />);

		const descriptionInput = screen.getByTestId<HTMLInputElement>(
			'project-description-input',
		);
		const saveButton = screen.getByTestId<HTMLButtonElement>(
			'project-setting-save-btn',
		);

		fireEvent.change(descriptionInput, {
			target: { value: `${project.description}i` },
		});
		fireEvent.change(descriptionInput, {
			target: { value: project.description },
		});
		fireEvent.click(saveButton);
		expect(handleUpdateProjectSpy).not.toHaveBeenCalled();
	});

	it('does not save when name is of invalid length', async () => {
		const {
			result: { current: setProjects },
		} = renderHook(useSetProjects);
		act(() => {
			setProjects([project]);
		});

		render(<ProjectGeneralSettings project={project} />);

		const nameInput =
			screen.getByTestId<HTMLInputElement>('project-name-input');
		const saveButton = screen.getByTestId<HTMLButtonElement>(
			'project-setting-save-btn',
		);

		fireEvent.change(nameInput, {
			target: { value: 'de' },
		});

		fireEvent.click(saveButton);
		expect(handleUpdateProjectSpy).not.toHaveBeenCalled();
	});
});

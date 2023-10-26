import { fireEvent } from '@testing-library/react';
import { ProjectFactory } from 'tests/factories';
import { render, renderHook, screen } from 'tests/test-utils';

import * as ProjectAPI from '@/api/projects-api';
import { ProjectGeneralSettings } from '@/components/projects/[projectId]/project-general-settings';
import { useSetProjects } from '@/stores/project-store';

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
		setProjects([project]);

		render(<ProjectGeneralSettings projectId={projectId} />);

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
		setProjects([project]);
		handleUpdateProjectSpy.mockResolvedValueOnce(project);

		render(<ProjectGeneralSettings projectId={projectId} />);

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
			projectId,
			data: {
				name: project.name,
				description: 'new description',
			},
		});
	});

	it('does not save when input is not pristine', async () => {
		const {
			result: { current: setProjects },
		} = renderHook(useSetProjects);
		setProjects([project]);

		render(<ProjectGeneralSettings projectId={projectId} />);

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
		setProjects([project]);

		render(<ProjectGeneralSettings projectId={projectId} />);

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

	it('does not save when input is of invalid length', async () => {
		const {
			result: { current: setProjects },
		} = renderHook(useSetProjects);
		setProjects([project]);

		render(<ProjectGeneralSettings projectId={projectId} />);

		const descriptionInput = screen.getByTestId<HTMLInputElement>(
			'project-description-input',
		);
		const saveButton = screen.getByTestId<HTMLButtonElement>(
			'project-setting-save-btn',
		);

		fireEvent.change(descriptionInput, {
			target: { value: 'de' },
		});
		fireEvent.click(saveButton);
		expect(handleUpdateProjectSpy).not.toHaveBeenCalled();
	});
});

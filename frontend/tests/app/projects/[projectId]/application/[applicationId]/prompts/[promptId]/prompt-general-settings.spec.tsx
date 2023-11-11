import { fireEvent, waitFor } from '@testing-library/react';
import {
	ApplicationFactory,
	ProjectFactory,
	PromptConfigFactory,
} from 'tests/factories';
import { render, renderHook, screen } from 'tests/test-utils';

import * as PromptConfigAPI from '@/api/prompt-config-api';
import { PromptGeneralSettings } from '@/components/projects/[projectId]/applications/[applicationId]/prompts/[promptId]/prompt-general-settings';
import { ApiError } from '@/errors';
import {
	useSetProjectApplications,
	useSetProjects,
	useSetPromptConfigs,
} from '@/stores/project-store';
import { ToastType } from '@/stores/toast-store';

describe('PromptGeneralSettings', () => {
	const handleUpdatePromptConfigSpy = vi.spyOn(
		PromptConfigAPI,
		'handleUpdatePromptConfig',
	);

	const {
		result: { current: setProjects },
	} = renderHook(useSetProjects);
	const project = ProjectFactory.buildSync();
	setProjects([project]);

	const application = ApplicationFactory.buildSync();
	const {
		result: { current: setProjectApplications },
	} = renderHook(useSetProjectApplications);
	setProjectApplications(project.id, [application]);

	const promptConfig = PromptConfigFactory.buildSync();
	const {
		result: { current: setPromptConfigs },
	} = renderHook(useSetPromptConfigs);
	setPromptConfigs(application.id, [promptConfig]);

	beforeEach(() => {
		vi.resetAllMocks();
	});

	it('renders prompt config details', async () => {
		render(
			<PromptGeneralSettings
				projectId={project.id}
				applicationId={application.id}
				promptConfigId={promptConfig.id}
			/>,
		);

		const nameInput =
			screen.getByTestId<HTMLInputElement>('prompt-name-input');
		expect(nameInput.value).toBe(promptConfig.name);

		const idInput = screen.getByTestId('prompt-id');
		expect(idInput.innerHTML).toBe(promptConfig.id);
	});

	it('renders null when prompt is not defined', async () => {
		render(
			<PromptGeneralSettings
				projectId={project.id}
				applicationId={application.id}
				promptConfigId={''}
			/>,
		);

		const settingsContainer = screen.queryByTestId(
			'prompt-general-settings-container',
		);
		expect(settingsContainer).not.toBeInTheDocument();
	});

	it('renders null when application is not defined', async () => {
		render(
			<PromptGeneralSettings
				projectId={project.id}
				applicationId={''}
				promptConfigId={promptConfig.id}
			/>,
		);

		const settingsContainer = screen.queryByTestId(
			'prompt-general-settings-container',
		);
		expect(settingsContainer).not.toBeInTheDocument();
	});

	it('does not save when form is pristine', async () => {
		render(
			<PromptGeneralSettings
				projectId={project.id}
				applicationId={application.id}
				promptConfigId={promptConfig.id}
			/>,
		);

		const saveBtn = screen.getByTestId('prompt-setting-save-btn');
		fireEvent.click(saveBtn);
		expect(handleUpdatePromptConfigSpy).not.toHaveBeenCalled();
	});

	it('does not save when form is unchanged', async () => {
		render(
			<PromptGeneralSettings
				projectId={project.id}
				applicationId={application.id}
				promptConfigId={promptConfig.id}
			/>,
		);

		const nameInput =
			screen.getByTestId<HTMLInputElement>('prompt-name-input');
		fireEvent.change(nameInput, {
			target: { value: `${promptConfig.name}i` },
		});
		fireEvent.change(nameInput, {
			target: { value: promptConfig.name },
		});

		const saveBtn = screen.getByTestId('prompt-setting-save-btn');
		fireEvent.click(saveBtn);
		expect(handleUpdatePromptConfigSpy).not.toHaveBeenCalled();
	});

	it('does not save when form is invalid', async () => {
		render(
			<PromptGeneralSettings
				projectId={project.id}
				applicationId={application.id}
				promptConfigId={promptConfig.id}
			/>,
		);

		const nameInput =
			screen.getByTestId<HTMLInputElement>('prompt-name-input');
		fireEvent.change(nameInput, {
			target: { value: 'de' },
		});

		const saveBtn = screen.getByTestId('prompt-setting-save-btn');
		fireEvent.click(saveBtn);
		expect(handleUpdatePromptConfigSpy).not.toHaveBeenCalled();
	});

	it('saves only when fields are changed and valid', async () => {
		render(
			<PromptGeneralSettings
				projectId={project.id}
				applicationId={application.id}
				promptConfigId={promptConfig.id}
			/>,
		);

		const nameInput =
			screen.getByTestId<HTMLInputElement>('prompt-name-input');
		fireEvent.change(nameInput, {
			target: { value: 'new name' },
		});

		const saveBtn = screen.getByTestId('prompt-setting-save-btn');
		fireEvent.click(saveBtn);
		// takes care of covering the loading line
		fireEvent.click(saveBtn);
		expect(handleUpdatePromptConfigSpy).toHaveBeenCalledWith({
			projectId: project.id,
			applicationId: application.id,
			promptConfigId: promptConfig.id,
			data: {
				name: 'new name',
			},
		});
	});

	it('shows error when unable to save prompt config changes', async () => {
		render(
			<PromptGeneralSettings
				projectId={project.id}
				applicationId={application.id}
				promptConfigId={promptConfig.id}
			/>,
		);

		const nameInput =
			screen.getByTestId<HTMLInputElement>('prompt-name-input');
		fireEvent.change(nameInput, {
			target: { value: 'new name' },
		});

		const errMessage = 'unable to save prompt config';
		handleUpdatePromptConfigSpy.mockImplementationOnce(() => {
			throw new ApiError(errMessage, {
				statusCode: 401,
				statusText: 'Bad Request',
			});
		});
		const saveBtn = screen.getByTestId('prompt-setting-save-btn');
		fireEvent.click(saveBtn);

		await waitFor(() => {
			const errorToast = screen.getByText(errMessage);
			expect(errorToast.className).toContain(ToastType.ERROR);
		});
	});
});

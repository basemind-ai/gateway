import {
	ApplicationFactory,
	OpenAIPromptConfigFactory,
	ProjectFactory,
} from 'tests/factories';
import {
	act,
	fireEvent,
	render,
	renderHook,
	screen,
	waitFor,
} from 'tests/test-utils';

import * as PromptConfigAPI from '@/api/prompt-config-api';
import { PromptConfigGeneralSettings } from '@/components/projects/[projectId]/applications/[applicationId]/configs/[configId]/prompt-config-general-settings';
import { ApiError } from '@/errors';
import {
	useSetProjectApplications,
	useSetProjects,
	useSetPromptConfigs,
} from '@/stores/api-store';
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
	act(() => {
		setProjects([project]);
	});

	const application = ApplicationFactory.buildSync();
	const {
		result: { current: setProjectApplications },
	} = renderHook(useSetProjectApplications);
	act(() => {
		setProjectApplications(project.id, [application]);
	});

	const promptConfig = OpenAIPromptConfigFactory.buildSync();
	const {
		result: { current: setPromptConfigs },
	} = renderHook(useSetPromptConfigs);
	setPromptConfigs(application.id, [promptConfig]);

	beforeEach(() => {
		vi.resetAllMocks();
	});

	it('renders prompt config details', async () => {
		render(
			<PromptConfigGeneralSettings
				projectId={project.id}
				applicationId={application.id}
				promptConfig={promptConfig}
			/>,
		);

		await waitFor(() => {
			const nameInput = screen.getByTestId<HTMLInputElement>(
				'prompt-general-settings-name-input',
			);

			expect(nameInput.value).toBe(promptConfig.name);
		});
	});

	it('does not save when form is pristine', async () => {
		render(
			<PromptConfigGeneralSettings
				projectId={project.id}
				applicationId={application.id}
				promptConfig={promptConfig}
			/>,
		);

		const saveBtn = screen.getByTestId(
			'prompt-general-settings-save-button',
		);
		fireEvent.click(saveBtn);
		expect(handleUpdatePromptConfigSpy).not.toHaveBeenCalled();
	});

	it('does not save when form is unchanged', async () => {
		render(
			<PromptConfigGeneralSettings
				projectId={project.id}
				applicationId={application.id}
				promptConfig={promptConfig}
			/>,
		);

		const nameInput = screen.getByTestId<HTMLInputElement>(
			'prompt-general-settings-name-input',
		);
		fireEvent.change(nameInput, {
			target: { value: `${promptConfig.name}i` },
		});
		fireEvent.change(nameInput, {
			target: { value: promptConfig.name },
		});

		const saveBtn = screen.getByTestId(
			'prompt-general-settings-save-button',
		);
		fireEvent.click(saveBtn);
		expect(handleUpdatePromptConfigSpy).not.toHaveBeenCalled();
	});

	it('does not save when form is invalid', async () => {
		render(
			<PromptConfigGeneralSettings
				projectId={project.id}
				applicationId={application.id}
				promptConfig={promptConfig}
			/>,
		);

		const nameInput = screen.getByTestId<HTMLInputElement>(
			'prompt-general-settings-name-input',
		);
		fireEvent.change(nameInput, {
			target: { value: 'de' },
		});

		const saveBtn = screen.getByTestId(
			'prompt-general-settings-save-button',
		);
		fireEvent.click(saveBtn);
		expect(handleUpdatePromptConfigSpy).not.toHaveBeenCalled();
	});

	it('save when when fields are changed and valid', async () => {
		render(
			<PromptConfigGeneralSettings
				projectId={project.id}
				applicationId={application.id}
				promptConfig={promptConfig}
			/>,
		);

		const nameInput = screen.getByTestId<HTMLInputElement>(
			'prompt-general-settings-name-input',
		);
		fireEvent.change(nameInput, {
			target: { value: 'new name' },
		});

		handleUpdatePromptConfigSpy.mockResolvedValueOnce({
			...promptConfig,
			name: 'new name',
		});

		const saveBtn = screen.getByTestId(
			'prompt-general-settings-save-button',
		);
		fireEvent.click(saveBtn);

		await waitFor(() => {
			expect(handleUpdatePromptConfigSpy).toHaveBeenCalledWith({
				applicationId: application.id,
				data: {
					name: 'new name',
				},
				projectId: project.id,
				promptConfigId: promptConfig.id,
			});
		});
	});

	it('shows error when unable to save prompt config changes', async () => {
		render(
			<PromptConfigGeneralSettings
				projectId={project.id}
				applicationId={application.id}
				promptConfig={promptConfig}
			/>,
		);

		const nameInput = screen.getByTestId<HTMLInputElement>(
			'prompt-general-settings-name-input',
		);
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
		const saveBtn = screen.getByTestId(
			'prompt-general-settings-save-button',
		);
		fireEvent.click(saveBtn);

		await waitFor(() => {
			const errorToast = screen.getByText(errMessage);
			expect(errorToast.className).toContain(ToastType.ERROR);
		});
	});
});

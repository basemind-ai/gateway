import { fireEvent, waitFor } from '@testing-library/react';
import {
	ApplicationFactory,
	ProjectFactory,
	PromptConfigFactory,
} from 'tests/factories';
import { render, renderHook, screen } from 'tests/test-utils';

import * as ApplicationAPI from '@/api/applications-api';
import * as PromptConfigAPI from '@/api/prompt-config-api';
import { ApplicationGeneralSettings } from '@/components/projects/[projectId]/applications/[applicationId]/application-general-settings';
import { ApiError } from '@/errors';
import {
	useSetProjectApplications,
	useSetProjects,
} from '@/stores/project-store';
import { ToastType } from '@/stores/toast-store';

describe('ApplicationGeneralSettings', () => {
	const handleRetrievePromptConfigsSpy = vi.spyOn(
		PromptConfigAPI,
		'handleRetrievePromptConfigs',
	);
	const handleSetDefaultPromptConfigSpy = vi.spyOn(
		PromptConfigAPI,
		'handleSetDefaultPromptConfig',
	);
	const handleUpdateApplicationSpy = vi.spyOn(
		ApplicationAPI,
		'handleUpdateApplication',
	);
	const {
		result: { current: setProjects },
	} = renderHook(useSetProjects);
	const projects = ProjectFactory.batchSync(1);
	setProjects(projects);

	const applications = ApplicationFactory.batchSync(1);
	const {
		result: { current: setProjectApplications },
	} = renderHook(useSetProjectApplications);
	setProjectApplications(projects[0].id, applications);

	const prompts = PromptConfigFactory.batchSync(2);
	prompts[0].isDefault = true;
	prompts[1].isDefault = false;

	beforeEach(() => {
		vi.resetAllMocks();
	});

	it('renders application details', async () => {
		handleRetrievePromptConfigsSpy.mockResolvedValueOnce(prompts);
		render(
			<ApplicationGeneralSettings
				projectId={projects[0].id}
				applicationId={applications[0].id}
			/>,
		);

		await waitFor(() => {
			const nameInput = screen.getByTestId<HTMLInputElement>(
				'application-name-input',
			);
			expect(nameInput.value).toBe(applications[0].name);
		});

		const descriptionInput = screen.getByTestId<HTMLInputElement>(
			'application-description-input',
		);
		expect(descriptionInput.value).toBe(applications[0].description);

		const defaultPromptSelect = screen.getByTestId<HTMLSelectElement>(
			'application-default-prompt',
		);
		expect(defaultPromptSelect.value).toBe(prompts[0].id);
	});

	it('does not save when form is pristine', async () => {
		handleRetrievePromptConfigsSpy.mockResolvedValueOnce(prompts);
		render(
			<ApplicationGeneralSettings
				projectId={projects[0].id}
				applicationId={applications[0].id}
			/>,
		);

		await waitFor(() => {
			const nameInput = screen.getByTestId<HTMLInputElement>(
				'application-name-input',
			);
			expect(nameInput.value).toBe(applications[0].name);
		});

		const saveBtn = screen.getByTestId('application-setting-save-btn');
		fireEvent.click(saveBtn);
		expect(handleUpdateApplicationSpy).not.toHaveBeenCalled();
	});

	it('does not save when form is unchanged', async () => {
		handleRetrievePromptConfigsSpy.mockResolvedValueOnce(prompts);
		render(
			<ApplicationGeneralSettings
				projectId={projects[0].id}
				applicationId={applications[0].id}
			/>,
		);

		await waitFor(() => {
			const nameInput = screen.getByTestId<HTMLInputElement>(
				'application-name-input',
			);
			expect(nameInput.value).toBe(applications[0].name);
		});

		const descriptionInput = screen.getByTestId<HTMLInputElement>(
			'application-description-input',
		);
		fireEvent.change(descriptionInput, {
			target: { value: `${applications[0].description}i` },
		});
		fireEvent.change(descriptionInput, {
			target: { value: applications[0].description },
		});

		const saveBtn = screen.getByTestId('application-setting-save-btn');
		fireEvent.click(saveBtn);
		expect(handleUpdateApplicationSpy).not.toHaveBeenCalled();
	});

	it('does not save when form is invalid', async () => {
		handleRetrievePromptConfigsSpy.mockResolvedValueOnce(prompts);
		render(
			<ApplicationGeneralSettings
				projectId={projects[0].id}
				applicationId={applications[0].id}
			/>,
		);

		await waitFor(() => {
			const nameInput = screen.getByTestId<HTMLInputElement>(
				'application-name-input',
			);
			expect(nameInput.value).toBe(applications[0].name);
		});

		const descriptionInput = screen.getByTestId<HTMLInputElement>(
			'application-description-input',
		);
		fireEvent.change(descriptionInput, {
			target: { value: 'de' },
		});

		const saveBtn = screen.getByTestId('application-setting-save-btn');
		fireEvent.click(saveBtn);
		expect(handleUpdateApplicationSpy).not.toHaveBeenCalled();
	});

	it('saves only when fields are changed and valid', async () => {
		handleRetrievePromptConfigsSpy.mockResolvedValueOnce(prompts);
		render(
			<ApplicationGeneralSettings
				projectId={projects[0].id}
				applicationId={applications[0].id}
			/>,
		);

		await waitFor(() => {
			const nameInput = screen.getByTestId<HTMLInputElement>(
				'application-name-input',
			);
			expect(nameInput.value).toBe(applications[0].name);
		});

		const saveBtn = screen.getByTestId('application-setting-save-btn');
		const descriptionInput = screen.getByTestId<HTMLInputElement>(
			'application-description-input',
		);

		handleUpdateApplicationSpy.mockResolvedValueOnce(applications[0]);
		fireEvent.change(descriptionInput, {
			target: { value: 'new description' },
		});
		fireEvent.click(saveBtn);
		expect(handleUpdateApplicationSpy).toHaveBeenCalledWith({
			projectId: projects[0].id,
			applicationId: applications[0].id,
			data: {
				name: applications[0].name,
				description: 'new description',
			},
		});
	});

	it('saves new default prompt config', async () => {
		handleRetrievePromptConfigsSpy.mockResolvedValueOnce(prompts);
		render(
			<ApplicationGeneralSettings
				projectId={projects[0].id}
				applicationId={applications[0].id}
			/>,
		);
		const defaultPromptSelect = screen.getByTestId<HTMLSelectElement>(
			'application-default-prompt',
		);
		await waitFor(() => {
			expect(defaultPromptSelect.value).toBe(prompts[0].id);
		});

		fireEvent.change(defaultPromptSelect, {
			target: { value: prompts[1].id },
		});

		const saveBtn = screen.getByTestId('application-setting-save-btn');
		handleRetrievePromptConfigsSpy.mockResolvedValueOnce(prompts);
		fireEvent.click(saveBtn);
		await waitFor(() => {
			expect(handleSetDefaultPromptConfigSpy).toHaveBeenCalledWith({
				projectId: projects[0].id,
				applicationId: applications[0].id,
				promptConfigId: prompts[1].id,
			});
		});
	});

	it('shows error when unable to fetch prompt configs', async () => {
		const errMessage =
			'unable to fetch prompt configs for application general';
		handleRetrievePromptConfigsSpy.mockImplementationOnce(() => {
			throw new ApiError(errMessage, {
				statusCode: 401,
				statusText: 'Bad Request',
			});
		});

		await waitFor(() =>
			render(
				<ApplicationGeneralSettings
					projectId={projects[0].id}
					applicationId={applications[0].id}
				/>,
			),
		);

		const errorToast = screen.getByText(errMessage);
		expect(errorToast.className).toContain(ToastType.ERROR);
	});

	it('shows error when unable to save prompt config changes', async () => {
		handleRetrievePromptConfigsSpy.mockResolvedValueOnce(prompts);
		render(
			<ApplicationGeneralSettings
				projectId={projects[0].id}
				applicationId={applications[0].id}
			/>,
		);
		const defaultPromptSelect = screen.getByTestId<HTMLSelectElement>(
			'application-default-prompt',
		);
		await waitFor(() => {
			expect(defaultPromptSelect.value).toBe(prompts[0].id);
		});

		fireEvent.change(defaultPromptSelect, {
			target: { value: prompts[1].id },
		});
		const errMessage = 'unable to save new default prompt config';
		handleSetDefaultPromptConfigSpy.mockImplementationOnce(() => {
			throw new ApiError(errMessage, {
				statusCode: 401,
				statusText: 'Bad Request',
			});
		});
		const saveBtn = screen.getByTestId('application-setting-save-btn');
		fireEvent.click(saveBtn);

		await waitFor(() => {
			const errorToast = screen.getByText(errMessage);
			expect(errorToast.className).toContain(ToastType.ERROR);
		});
	});
});

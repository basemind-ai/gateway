import { fireEvent, waitFor } from '@testing-library/react';
import {
	ApplicationFactory,
	ProjectFactory,
	PromptConfigFactory,
} from 'tests/factories';
import { render, renderHook, screen } from 'tests/test-utils';
import { beforeEach, describe, expect } from 'vitest';

import * as ApplicationAPI from '@/api/applications-api';
import * as PromptConfigAPI from '@/api/prompt-config-api';
import { ApplicationGeneralSettings } from '@/app/projects/[projectId]/applications/[applicationId]/page';
import {
	useSetProjectApplications,
	useSetProjects,
} from '@/stores/project-store';

// eslint-disable-next-line vitest/valid-describe-callback
describe('ApplicationGeneralSettings tests', async () => {
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
	const projects = await ProjectFactory.batch(1);
	setProjects(projects);

	const applications = await ApplicationFactory.batch(1);
	const {
		result: { current: setProjectApplications },
	} = renderHook(useSetProjectApplications);
	setProjectApplications(projects[0].id, applications);

	const prompts = await PromptConfigFactory.batch(2);
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
		//     Nothing changed, click save
		fireEvent.click(saveBtn);
		expect(handleUpdateApplicationSpy).not.toHaveBeenCalled();

		// Change description and revert to original
		const descriptionInput = screen.getByTestId<HTMLInputElement>(
			'application-description-input',
		);
		fireEvent.change(descriptionInput, {
			target: { value: `${applications[0].description}i` },
		});
		fireEvent.change(descriptionInput, {
			target: { value: applications[0].description },
		});
		fireEvent.click(saveBtn);
		expect(handleUpdateApplicationSpy).not.toHaveBeenCalled();

		// 	Change description to invalid length
		fireEvent.change(descriptionInput, {
			target: { value: 'de' },
		});
		fireEvent.click(saveBtn);
		expect(handleUpdateApplicationSpy).not.toHaveBeenCalled();

		// Finally make a meaningful change
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
});

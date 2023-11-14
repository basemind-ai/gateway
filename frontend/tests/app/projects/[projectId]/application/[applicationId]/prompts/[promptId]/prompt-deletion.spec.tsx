import { fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import {
	ApplicationFactory,
	ProjectFactory,
	PromptConfigFactory,
} from 'tests/factories';
import { render, renderHook, screen } from 'tests/test-utils';

import * as PromptConfigAPI from '@/api/prompt-config-api';
import { PromptDeletion } from '@/components/projects/[projectId]/applications/[applicationId]/prompts/[promptId]/prompt-deletion';
import { ApiError } from '@/errors';
import {
	useSetProjectApplications,
	useSetProjects,
	useSetPromptConfigs,
} from '@/stores/api-store';
import { ToastType } from '@/stores/toast-store';

describe('PromptDeletion', () => {
	const handleDeletePromptConfigSpy = vi.spyOn(
		PromptConfigAPI,
		'handleDeletePromptConfig',
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

	beforeAll(() => {
		HTMLDialogElement.prototype.showModal = vi.fn();
		HTMLDialogElement.prototype.close = vi.fn();
	});

	it('renders prompt config deletion component', () => {
		const promptConfig = PromptConfigFactory.buildSync();
		const {
			result: { current: setPromptConfigs },
		} = renderHook(useSetPromptConfigs);
		setPromptConfigs(application.id, [promptConfig]);

		render(
			<PromptDeletion
				projectId={project.id}
				applicationId={application.id}
				promptConfigId={promptConfig.id}
			/>,
		);

		const rootContainer = screen.getByTestId('prompt-deletion-container');
		expect(rootContainer).toBeInTheDocument();
	});

	it('renders null when prompt config not present', () => {
		render(
			<PromptDeletion
				projectId={project.id}
				applicationId={application.id}
				promptConfigId={''}
			/>,
		);

		const rootContainer = screen.queryByTestId('prompt-deletion-container');
		expect(rootContainer).not.toBeInTheDocument();
	});

	it('renders confirmation banner and deletes prompt config after entering input', async () => {
		const promptConfig = PromptConfigFactory.buildSync();
		const {
			result: { current: setPromptConfigs },
		} = renderHook(useSetPromptConfigs);
		setPromptConfigs(application.id, [promptConfig]);

		render(
			<PromptDeletion
				projectId={project.id}
				applicationId={application.id}
				promptConfigId={promptConfig.id}
			/>,
		);

		const deleteBtn = screen.getByTestId('prompt-delete-btn');
		fireEvent.click(deleteBtn);

		const deletionBannerTitle = screen.getByTestId(
			'resource-deletion-title',
		);
		expect(deletionBannerTitle).toBeInTheDocument();

		const deletionInput = screen.getByTestId('resource-deletion-input');
		fireEvent.change(deletionInput, {
			target: { value: promptConfig.name },
		});
		const deletionBannerDeleteBtn = screen.getByTestId(
			'resource-deletion-delete-btn',
		);
		fireEvent.click(deletionBannerDeleteBtn);
		// takes care of covering the loading line
		fireEvent.click(deletionBannerDeleteBtn);

		await waitFor(() => {
			expect(handleDeletePromptConfigSpy).toHaveBeenCalledOnce();
		});
	});

	it('shows error when unable to delete prompt config', async () => {
		const promptConfig = PromptConfigFactory.buildSync();
		const {
			result: { current: setPromptConfigs },
		} = renderHook(useSetPromptConfigs);
		setPromptConfigs(application.id, [promptConfig]);

		render(
			<PromptDeletion
				projectId={project.id}
				applicationId={application.id}
				promptConfigId={promptConfig.id}
			/>,
		);
		const deleteBtn = screen.getByTestId('prompt-delete-btn');
		fireEvent.click(deleteBtn);

		const deletionBannerTitle = screen.getByTestId(
			'resource-deletion-title',
		);
		expect(deletionBannerTitle).toBeInTheDocument();

		const deletionInput = screen.getByTestId('resource-deletion-input');
		fireEvent.change(deletionInput, {
			target: { value: promptConfig.name },
		});

		handleDeletePromptConfigSpy.mockImplementationOnce(() => {
			throw new ApiError('unable to delete prompt config', {
				statusCode: 401,
				statusText: 'Bad Request',
			});
		});

		const deletionBannerDeleteBtn = screen.getByTestId(
			'resource-deletion-delete-btn',
		);
		fireEvent.click(deletionBannerDeleteBtn);

		const errorToast = screen.getByText('unable to delete prompt config');
		expect(errorToast.className).toContain(ToastType.ERROR);
	});
});

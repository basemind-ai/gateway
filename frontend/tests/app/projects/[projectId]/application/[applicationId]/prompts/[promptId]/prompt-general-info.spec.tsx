import { fireEvent, waitFor } from '@testing-library/react';
import { ApplicationFactory, PromptConfigFactory } from 'tests/factories';
import { routerPushMock } from 'tests/mocks';
import { render, renderHook, screen } from 'tests/test-utils';
import { expect } from 'vitest';

import * as PromptConfigAPI from '@/api/prompt-config-api';
import { PromptGeneralInfo } from '@/components/projects/[projectId]/applications/[applicationId]/prompts/[promptId]/prompt-general-info';
import { ApiError } from '@/errors';
import {
	usePromptConfig,
	useSetProjectApplications,
	useSetPromptConfigs,
} from '@/stores/project-store';
import { ToastType } from '@/stores/toast-store';

describe('PromptGeneralInfo', () => {
	const handleCreatePromptConfigSpy = vi.spyOn(
		PromptConfigAPI,
		'handleCreatePromptConfig',
	);

	const projectId = '1';
	const application = ApplicationFactory.buildSync();

	const {
		result: { current: setProjectApplications },
	} = renderHook(useSetProjectApplications);
	setProjectApplications(projectId, [application]);

	const promptConfig = PromptConfigFactory.buildSync();
	const {
		result: { current: setPromptConfigs },
	} = renderHook(useSetPromptConfigs);
	setPromptConfigs(application.id, [promptConfig]);

	it('renders prompt settings', () => {
		render(
			<PromptGeneralInfo
				projectId={projectId}
				applicationId={application.id}
				promptConfigId={promptConfig.id}
			/>,
		);

		const promptName = screen.getByTestId('prompt-general-info-name');
		expect(promptName.innerHTML).toBe(promptConfig.name);
	});

	it('returns null when application not found', () => {
		render(
			<PromptGeneralInfo
				projectId={projectId}
				applicationId={'2'}
				promptConfigId={promptConfig.id}
			/>,
		);

		const settingsContainer = screen.queryByTestId(
			'prompt-general-info-container',
		);
		expect(settingsContainer).not.toBeInTheDocument();
	});

	it('navigates to prompt testing screen when clicked on test button', () => {
		render(
			<PromptGeneralInfo
				projectId={projectId}
				applicationId={application.id}
				promptConfigId={promptConfig.id}
			/>,
		);

		const testButton = screen.getByTestId('prompt-test-btn');
		fireEvent.click(testButton);
		expect(routerPushMock).toHaveBeenCalledWith(
			`/projects/${projectId}/applications/${application.id}/${promptConfig.id}/testing`,
		);
	});

	it('successfully clones a prompt and navigates to it', async () => {
		render(
			<PromptGeneralInfo
				projectId={projectId}
				applicationId={application.id}
				promptConfigId={promptConfig.id}
			/>,
		);

		const clonedPromptConfig = PromptConfigFactory.buildSync();
		handleCreatePromptConfigSpy.mockResolvedValueOnce(clonedPromptConfig);

		const cloneButton = screen.getByTestId('prompt-clone-btn');
		fireEvent.click(cloneButton);
		// This takes care of debounce line coverage
		fireEvent.click(cloneButton);

		await waitFor(() => {
			expect(handleCreatePromptConfigSpy).toHaveBeenCalledOnce();
		});

		const {
			result: { current: clonedPromptConfigInStore },
		} = renderHook(() =>
			usePromptConfig(application.id, clonedPromptConfig.id),
		);
		expect(clonedPromptConfigInStore).toBe(clonedPromptConfig);

		expect(routerPushMock).toHaveBeenCalledWith(
			`/projects/${projectId}/applications/${application.id}/prompts/${clonedPromptConfig.id}`,
		);
	});

	it('shows error when fails to clone a prompt', () => {
		render(
			<PromptGeneralInfo
				projectId={projectId}
				applicationId={application.id}
				promptConfigId={promptConfig.id}
			/>,
		);

		handleCreatePromptConfigSpy.mockImplementationOnce(() => {
			throw new ApiError('unable to clone prompt config', {
				statusCode: 401,
				statusText: 'Bad Request',
			});
		});

		const cloneButton = screen.getByTestId('prompt-clone-btn');
		fireEvent.click(cloneButton);

		const errorToast = screen.getByText('unable to clone prompt config');
		expect(errorToast.className).toContain(ToastType.ERROR);
	});
});

import { fireEvent, waitFor } from '@testing-library/react';
import { ApplicationFactory, OpenAIPromptConfigFactory } from 'tests/factories';
import { routerPushMock } from 'tests/mocks';
import { render, renderHook, screen } from 'tests/test-utils';
import { expect } from 'vitest';

import * as PromptConfigAPI from '@/api/prompt-config-api';
import { PromptConfigGeneralInfo } from '@/components/projects/[projectId]/applications/[applicationId]/config/[configId]/prompt-config-general-info';
import { ApiError } from '@/errors';
import {
	usePromptConfig,
	useSetProjectApplications,
	useSetPromptConfigs,
} from '@/stores/api-store';
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

	const promptConfig = OpenAIPromptConfigFactory.buildSync();
	const {
		result: { current: setPromptConfigs },
	} = renderHook(useSetPromptConfigs);
	setPromptConfigs(application.id, [promptConfig]);

	it('renders prompt settings', () => {
		render(
			<PromptConfigGeneralInfo
				projectId={projectId}
				applicationId={application.id}
				promptConfig={promptConfig}
				navigateToPromptTesting={vi.fn()}
			/>,
		);

		const promptName = screen.getByTestId('prompt-general-info-name');
		expect(promptName.innerHTML).toBe(promptConfig.name);
	});

	it('returns null when application not found', () => {
		render(
			<PromptConfigGeneralInfo
				projectId={projectId}
				applicationId={'2'}
				promptConfig={promptConfig}
				navigateToPromptTesting={vi.fn()}
			/>,
		);

		const settingsContainer = screen.queryByTestId(
			'prompt-general-info-container',
		);
		expect(settingsContainer).not.toBeInTheDocument();
	});

	it('navigates to prompt testing screen when clicked on test button', () => {
		render(
			<PromptConfigGeneralInfo
				projectId={projectId}
				applicationId={application.id}
				promptConfig={promptConfig}
				navigateToPromptTesting={vi.fn()}
			/>,
		);

		const testButton = screen.getByTestId('prompt-test-btn');
		fireEvent.click(testButton);
		expect(routerPushMock).toHaveBeenCalledWith(
			`/en/projects/${projectId}/applications/${application.id}/${promptConfig.id}/testing`,
		);
	});

	it('successfully clones a prompt and navigates to it', async () => {
		render(
			<PromptConfigGeneralInfo
				projectId={projectId}
				applicationId={application.id}
				promptConfig={promptConfig}
				navigateToPromptTesting={vi.fn()}
			/>,
		);

		const clonedPromptConfig = OpenAIPromptConfigFactory.buildSync();
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
			`/en/projects/${projectId}/applications/${application.id}/${clonedPromptConfig.id}/${clonedPromptConfig.name}`,
		);
	});

	it('shows error when fails to clone a prompt', () => {
		render(
			<PromptConfigGeneralInfo
				projectId={projectId}
				applicationId={application.id}
				promptConfig={promptConfig}
				navigateToPromptTesting={vi.fn()}
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

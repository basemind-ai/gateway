import { faker } from '@faker-js/faker';
import { ApplicationFactory, OpenAIPromptConfigFactory } from 'tests/factories';
import { routerPushMock } from 'tests/mocks';
import { fireEvent, render, screen } from 'tests/test-utils';
import { expect } from 'vitest';

import * as PromptConfigAPI from '@/api/prompt-config-api';
import { ApplicationPromptConfigs } from '@/components/projects/[projectId]/applications/[applicationId]/application-prompt-configs';
import { Navigation } from '@/constants';
import { ApiError } from '@/errors';
import { ToastType } from '@/stores/toast-store';
import { setRouteParams } from '@/utils/navigation';

describe('ApplicationPromptConfigs', () => {
	const projectId = faker.string.uuid();
	const application = ApplicationFactory.buildSync();
	const handleRetrievePromptConfigsSpy = vi.spyOn(
		PromptConfigAPI,
		'handleRetrievePromptConfigs',
	);

	it('renders prompt configs', async () => {
		const promptConfigs = await OpenAIPromptConfigFactory.batch(2);
		handleRetrievePromptConfigsSpy.mockResolvedValueOnce(promptConfigs);
		render(
			<ApplicationPromptConfigs
				projectId={projectId}
				application={application}
			/>,
		);
		await screen.findByTestId('application-prompt-config-container');

		for (const promptConfig of promptConfigs) {
			const [nameElement] = screen.getAllByText(promptConfig.name);
			expect(nameElement).toBeInTheDocument();
		}
	});

	it('shows error when unable to fetch prompt configs', async () => {
		handleRetrievePromptConfigsSpy.mockImplementationOnce(() => {
			throw new ApiError('unable to fetch prompt configs', {
				statusCode: 401,
				statusText: 'Bad Request',
			});
		});
		render(
			<ApplicationPromptConfigs
				projectId={projectId}
				application={application}
			/>,
		);
		await screen.findByTestId('application-prompt-config-container');

		const errorToast = screen.getByText('unable to fetch prompt configs');
		expect(errorToast.className).toContain(ToastType.ERROR);
	});

	it('copies application id to clipboard', async () => {
		const promptConfigs = await OpenAIPromptConfigFactory.batch(2);
		handleRetrievePromptConfigsSpy.mockResolvedValueOnce(promptConfigs);

		const writeText = vi.fn();
		Object.assign(navigator, {
			clipboard: {
				writeText,
			},
		});
		render(
			<ApplicationPromptConfigs
				projectId={projectId}
				application={application}
			/>,
		);
		await screen.findByTestId('application-prompt-config-container');

		const [copyButton] = screen.getAllByTestId(
			'application-prompt-configs-table-config-id-copy-button',
		);
		expect(copyButton).toBeInTheDocument();

		fireEvent.click(copyButton);
		expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
			promptConfigs[0].id,
		);
	});

	it('navigates to edit prompt screen', async () => {
		const promptConfigs = await OpenAIPromptConfigFactory.batch(1);
		handleRetrievePromptConfigsSpy.mockResolvedValueOnce(promptConfigs);
		render(
			<ApplicationPromptConfigs
				projectId={projectId}
				application={application}
			/>,
		);
		await screen.findByTestId('application-prompt-config-container');

		const editButton = screen.getByTestId(
			'application-prompt-configs-table-config-edit-button',
		);
		fireEvent.click(editButton);

		expect(routerPushMock).toHaveBeenCalledWith(
			`/en/projects/${projectId}/applications/${application.id}/configs/${promptConfigs[0].id}#tab-2`,
		);
	});

	it('opens the prompt config creation wizard when the add prompt config button is pressed', async () => {
		const promptConfigs = await OpenAIPromptConfigFactory.batch(1);
		handleRetrievePromptConfigsSpy.mockResolvedValueOnce(promptConfigs);
		render(
			<ApplicationPromptConfigs
				projectId={projectId}
				application={application}
			/>,
		);
		await screen.findByTestId('application-prompt-config-container');

		const addPromptConfigButton = screen.getByTestId(
			'application-prompt-config-new-prompt-config-button',
		);
		fireEvent.click(addPromptConfigButton);

		expect(routerPushMock).toHaveBeenCalledWith(
			setRouteParams(Navigation.ConfigCreateWizard, {
				applicationId: application.id,
				projectId,
			}),
		);
	});
});

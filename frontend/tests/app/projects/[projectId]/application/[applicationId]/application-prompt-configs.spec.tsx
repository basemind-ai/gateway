import { fireEvent, waitFor } from '@testing-library/react';
import { OpenAIPromptConfigFactory } from 'tests/factories';
import { routerPushMock } from 'tests/mocks';
import { render, screen } from 'tests/test-utils';
import { expect } from 'vitest';

import * as PromptConfigAPI from '@/api/prompt-config-api';
import { ApplicationPromptConfigs } from '@/components/projects/[projectId]/applications/[applicationId]/application-prompt-configs';
import { ApiError } from '@/errors';
import { ToastType } from '@/stores/toast-store';

describe('ApplicationPromptConfigs', () => {
	// TODO: add more tests when adding new config, test and edit functionality
	// This component is incomplete as of now
	const projectId = '1';
	const applicationId = '2';
	const handleRetrievePromptConfigsSpy = vi.spyOn(
		PromptConfigAPI,
		'handleRetrievePromptConfigs',
	);

	it('renders prompt configs', async () => {
		const promptConfigs = await OpenAIPromptConfigFactory.batch(2);
		handleRetrievePromptConfigsSpy.mockResolvedValueOnce(promptConfigs);

		await waitFor(() =>
			render(
				<ApplicationPromptConfigs
					projectId={projectId}
					applicationId={applicationId}
				/>,
			),
		);

		for (const promptConfig of promptConfigs) {
			const nameElement = screen.getByText(promptConfig.name);
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

		await waitFor(() =>
			render(
				<ApplicationPromptConfigs
					projectId={projectId}
					applicationId={applicationId}
				/>,
			),
		);

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

		await waitFor(() =>
			render(
				<ApplicationPromptConfigs
					projectId={projectId}
					applicationId={applicationId}
				/>,
			),
		);

		const [copyButton] = screen.getAllByTestId('prompt-config-copy-btn');
		expect(copyButton).toBeInTheDocument();

		fireEvent.click(copyButton);
		expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
			promptConfigs[0].id,
		);
	});

	it('navigates to edit prompt screen', async () => {
		const promptConfigs = await OpenAIPromptConfigFactory.batch(1);
		handleRetrievePromptConfigsSpy.mockResolvedValueOnce(promptConfigs);

		await waitFor(() =>
			render(
				<ApplicationPromptConfigs
					projectId={projectId}
					applicationId={applicationId}
				/>,
			),
		);

		const editButton = screen.getByTestId('application-edit-prompt-button');
		fireEvent.click(editButton);

		expect(routerPushMock).toHaveBeenCalledWith(
			`/en/projects/${projectId}/applications/${applicationId}/${promptConfigs[0].id}`,
		);
	});
});

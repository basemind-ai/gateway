import { fireEvent, waitFor } from '@testing-library/react';
import { PromptConfigFactory } from 'tests/factories';
import { render, screen } from 'tests/test-utils';

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
		const promptConfigs = await PromptConfigFactory.batch(2);
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
		const promptConfigs = await PromptConfigFactory.batch(2);
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
});

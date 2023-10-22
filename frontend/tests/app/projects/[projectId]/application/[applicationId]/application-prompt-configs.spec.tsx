import { fireEvent, waitFor } from '@testing-library/react';
import { PromptConfigFactory } from 'tests/factories';
import { render, screen } from 'tests/test-utils';
import { describe, expect } from 'vitest';

import * as PromptConfigAPI from '@/api/prompt-config-api';
import { ApplicationPromptConfigs } from '@/app/projects/[projectId]/application/[applicationId]/page';

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
			const modelTypeElement = screen.getByText(promptConfig.name);
			expect(nameElement).toBeInTheDocument();
			expect(modelTypeElement).toBeInTheDocument();
		}
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

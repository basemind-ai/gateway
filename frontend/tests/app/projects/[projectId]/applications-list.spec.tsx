import { waitFor } from '@testing-library/react';
import { ApplicationFactory, PromptConfigFactory } from 'tests/factories';
import { render, screen } from 'tests/test-utils';
import { beforeEach } from 'vitest';

import * as ApplicationAPI from '@/api/applications-api';
import * as PromptConfigAPI from '@/api/prompt-config-api';
import { ApplicationsList } from '@/components/projects/[projectId]/applications-list';
import { Navigation } from '@/constants';
import { populateApplicationId, populateProjectId } from '@/utils/navigation';

describe('ApplicationsList', () => {
	// TODO: add more tests when adding new application screen
	// This component is incomplete as of now
	const projectId = '1';
	const handleRetrievePromptConfigsSpy = vi.spyOn(
		PromptConfigAPI,
		'handleRetrievePromptConfigs',
	);
	const handleRetrieveApplicationsSpy = vi.spyOn(
		ApplicationAPI,
		'handleRetrieveApplications',
	);

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders application list', async () => {
		const applications = ApplicationFactory.batchSync(2);
		handleRetrieveApplicationsSpy.mockResolvedValueOnce(applications);
		const promptConfigLengths = [2, 3];
		promptConfigLengths.forEach((configLength) => {
			handleRetrievePromptConfigsSpy.mockReturnValueOnce(
				PromptConfigFactory.batch(configLength),
			);
		});

		await waitFor(() => render(<ApplicationsList projectId={projectId} />));

		for (const [index, application] of applications.entries()) {
			const nameElement = screen.getByText(application.name);
			expect(nameElement).toBeInTheDocument();

			const configLengthElements = screen.getAllByTestId(
				'application-prompt-config-count',
			);
			expect(configLengthElements[index].innerHTML).toBe(
				promptConfigLengths[index].toString(),
			);
		}
	});

	it('routes to application screen when clicked on application name or edit button', async () => {
		const applications = ApplicationFactory.batchSync(2);
		handleRetrieveApplicationsSpy.mockResolvedValueOnce(applications);
		const promptConfigLengths = [2, 3];
		promptConfigLengths.forEach((configLength) => {
			handleRetrievePromptConfigsSpy.mockReturnValueOnce(
				PromptConfigFactory.batch(configLength),
			);
		});

		await waitFor(() => render(<ApplicationsList projectId={projectId} />));

		const applicationUrl = populateApplicationId(
			populateProjectId(Navigation.Applications, projectId),
			applications[0].id,
		);

		const [applicationNameElement] =
			screen.getAllByTestId<HTMLAnchorElement>('application-name-anchor');
		expect(applicationNameElement.href).toContain(applicationUrl);

		const [applicationEditElement] =
			screen.getAllByTestId<HTMLAnchorElement>('application-edit-anchor');
		expect(applicationEditElement.href).toContain(applicationUrl);
	});
});

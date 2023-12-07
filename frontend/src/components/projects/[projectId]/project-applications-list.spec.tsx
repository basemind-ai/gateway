import {
	ApplicationFactory,
	OpenAIPromptConfigFactory,
	ProjectFactory,
} from 'tests/factories';
import { routerPushMock } from 'tests/mocks';
import { fireEvent, render, screen, waitFor } from 'tests/test-utils';
import { expect } from 'vitest';

import * as ApplicationAPI from '@/api/applications-api';
import * as PromptConfigAPI from '@/api/prompt-config-api';
import { ProjectApplicationsList } from '@/components/projects/[projectId]/project-applications-list';
import { ApiError } from '@/errors';
import { ToastType } from '@/stores/toast-store';

describe('ApplicationsList', () => {
	const project = ProjectFactory.buildSync();
	const handleRetrievePromptConfigsSpy = vi.spyOn(
		PromptConfigAPI,
		'handleRetrievePromptConfigs',
	);
	const handleRetrieveApplicationsSpy = vi.spyOn(
		ApplicationAPI,
		'handleRetrieveApplications',
	);

	it('renders application list', async () => {
		const applications = ApplicationFactory.batchSync(2);
		handleRetrieveApplicationsSpy.mockResolvedValueOnce(applications);
		const promptConfigLengths = [2, 3];
		promptConfigLengths.forEach((configLength) => {
			handleRetrievePromptConfigsSpy.mockReturnValueOnce(
				OpenAIPromptConfigFactory.batch(configLength),
			);
		});

		render(<ProjectApplicationsList project={project} />);
		await waitFor(() => {
			expect(
				screen.getByTestId('project-application-list-container'),
			).toBeInTheDocument();
		});

		for (const [index, application] of applications.entries()) {
			const nameElement = screen.getByText(application.name);
			expect(nameElement).toBeInTheDocument();

			await waitFor(() => {
				const configLengthElements = screen.getByTestId(
					`application-prompt-config-count-${application.id}`,
				);
				expect(configLengthElements).toHaveTextContent(
					promptConfigLengths[index].toString(),
				);
			});
		}
	});

	it('routes to application screen when clicked on application name or edit button', async () => {
		const applications = ApplicationFactory.batchSync(2);
		handleRetrieveApplicationsSpy.mockResolvedValueOnce(applications);
		const promptConfigLengths = [2, 3];
		promptConfigLengths.forEach((configLength) => {
			handleRetrievePromptConfigsSpy.mockReturnValueOnce(
				OpenAIPromptConfigFactory.batch(configLength),
			);
		});

		render(<ProjectApplicationsList project={project} />);
		await waitFor(() => {
			expect(
				screen.getByTestId('project-application-list-container'),
			).toBeInTheDocument();
		});

		const [applicationNameButton] =
			screen.getAllByTestId<HTMLButtonElement>(
				'project-application-list-name-button',
			);

		fireEvent.click(applicationNameButton);
		await waitFor(() => {
			expect(routerPushMock).toHaveBeenCalledOnce();
		});

		const [applicationEditButton] =
			screen.getAllByTestId<HTMLButtonElement>(
				'project-application-list-edit-button',
			);
		fireEvent.click(applicationEditButton);
		await waitFor(() => {
			expect(routerPushMock).toHaveBeenCalledTimes(2);
		});
	});

	it('opens the app creation dialog', async () => {
		handleRetrieveApplicationsSpy.mockResolvedValueOnce([]);

		render(<ProjectApplicationsList project={project} />);

		const newAppButton = screen.getByTestId('new-application-btn');
		fireEvent.click(newAppButton);

		await waitFor(() => {
			expect(screen.getByTestId('dialog-modal')).toBeInTheDocument();
		});
	});

	it('shows error when unable to get applications', async () => {
		handleRetrieveApplicationsSpy.mockImplementationOnce(() => {
			throw new ApiError('unable to get applications', {
				statusCode: 401,
				statusText: 'Bad Request',
			});
		});

		render(<ProjectApplicationsList project={project} />);

		const errorToast = screen.getByText('unable to get applications');
		expect(errorToast.className).toContain(ToastType.ERROR);
	});
});

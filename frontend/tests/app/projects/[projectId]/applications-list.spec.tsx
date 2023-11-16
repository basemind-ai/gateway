import { fireEvent, waitFor } from '@testing-library/react';
import { ApplicationFactory, OpenAIPromptConfigFactory } from 'tests/factories';
import { render, screen } from 'tests/test-utils';
import { beforeEach, expect } from 'vitest';

import * as ApplicationAPI from '@/api/applications-api';
import * as PromptConfigAPI from '@/api/prompt-config-api';
import { ApplicationsList } from '@/components/projects/[projectId]/applications-list';
import { Navigation } from '@/constants';
import { ApiError } from '@/errors';
import { ToastType } from '@/stores/toast-store';
import { setApplicationId, setProjectId } from '@/utils/navigation';

describe('ApplicationsList', () => {
	const projectId = '1';
	const handleRetrievePromptConfigsSpy = vi.spyOn(
		PromptConfigAPI,
		'handleRetrievePromptConfigs',
	);
	const handleRetrieveApplicationsSpy = vi.spyOn(
		ApplicationAPI,
		'handleRetrieveApplications',
	);

	const showModal = vi.fn();
	const closeModal = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	beforeAll(() => {
		HTMLDialogElement.prototype.showModal = showModal;
		HTMLDialogElement.prototype.close = closeModal;
	});

	it('renders application list', async () => {
		const applications = ApplicationFactory.batchSync(2);
		handleRetrieveApplicationsSpy.mockResolvedValueOnce(applications);
		const promptConfigLengths = [2, 3];
		promptConfigLengths.forEach((configLength) => {
			handleRetrievePromptConfigsSpy.mockReturnValueOnce(
				OpenAIPromptConfigFactory.batch(configLength),
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
				OpenAIPromptConfigFactory.batch(configLength),
			);
		});

		await waitFor(() => render(<ApplicationsList projectId={projectId} />));

		const applicationUrl = setApplicationId(
			setProjectId(Navigation.Applications, projectId),
			applications[0].id,
		);

		const [applicationNameElement] =
			screen.getAllByTestId<HTMLAnchorElement>('application-name-anchor');
		expect(applicationNameElement.href).toContain(applicationUrl);

		const [applicationEditElement] =
			screen.getAllByTestId<HTMLAnchorElement>('application-edit-anchor');
		expect(applicationEditElement.href).toContain(applicationUrl);
	});

	it('opens and closes the app creation dialog', async () => {
		handleRetrieveApplicationsSpy.mockResolvedValueOnce([]);

		render(<ApplicationsList projectId={projectId} />);

		const newAppButton = screen.getByTestId('new-application-btn');
		fireEvent.click(newAppButton);

		expect(showModal).toHaveBeenCalledOnce();

		const cancelButton = screen.getByTestId<HTMLButtonElement>(
			'create-application-cancel-btn',
		);
		fireEvent.click(cancelButton);

		expect(closeModal).toHaveBeenCalledOnce();
	});

	it('shows error when unable to get applications', async () => {
		handleRetrieveApplicationsSpy.mockImplementationOnce(() => {
			throw new ApiError('unable to get applications', {
				statusCode: 401,
				statusText: 'Bad Request',
			});
		});

		render(<ApplicationsList projectId={projectId} />);

		const errorToast = screen.getByText('unable to get applications');
		expect(errorToast.className).toContain(ToastType.ERROR);
	});
});

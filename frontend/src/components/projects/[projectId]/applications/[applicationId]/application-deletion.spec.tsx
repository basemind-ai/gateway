import { ApplicationFactory, ProjectFactory } from 'tests/factories';
import {
	fireEvent,
	render,
	renderHook,
	screen,
	waitFor,
} from 'tests/test-utils';

import * as ApplicationAPI from '@/api/applications-api';
import { ApplicationDeletion } from '@/components/projects/[projectId]/applications/[applicationId]/application-deletion';
import { ApiError } from '@/errors';
import { usePageTracking } from '@/hooks/use-page-tracking';
import { useSetProjectApplications, useSetProjects } from '@/stores/api-store';
import { ToastType } from '@/stores/toast-store';

describe('ApplicationDeletion tests', () => {
	const handleDeleteApplicationSpy = vi.spyOn(
		ApplicationAPI,
		'handleDeleteApplication',
	);

	const {
		result: { current: setProjects },
	} = renderHook(useSetProjects);
	const projects = ProjectFactory.batchSync(1);
	setProjects(projects);

	const applications = ApplicationFactory.batchSync(2);
	const {
		result: { current: setProjectApplications },
	} = renderHook(useSetProjectApplications);
	setProjectApplications(projects[0].id, applications);

	it('renders application deletion component', () => {
		render(
			<ApplicationDeletion
				projectId={projects[0].id}
				application={applications[0]}
			/>,
		);

		const rootContainer = screen.getByTestId(
			'application-deletion-container',
		);
		expect(rootContainer).toBeInTheDocument();
	});

	it('renders confirmation banner and deletes application after entering input', async () => {
		render(
			<ApplicationDeletion
				projectId={projects[0].id}
				application={applications[0]}
			/>,
		);

		const deleteBtn = screen.getByTestId('application-delete-btn');
		fireEvent.click(deleteBtn);

		const deletionBannerTitle = screen.getByTestId(
			'resource-deletion-title',
		);
		expect(deletionBannerTitle).toBeInTheDocument();

		const deletionInput = screen.getByTestId('resource-deletion-input');
		fireEvent.change(deletionInput, {
			target: { value: applications[0].name },
		});
		const deletionBannerDeleteBtn = screen.getByTestId(
			'resource-deletion-delete-btn',
		);
		fireEvent.click(deletionBannerDeleteBtn);

		await waitFor(() => {
			expect(handleDeleteApplicationSpy).toHaveBeenCalledOnce();
		});
	});

	it('shows error when unable to delete application', async () => {
		render(
			<ApplicationDeletion
				projectId={projects[0].id}
				application={applications[1]}
			/>,
		);

		const deleteBtn = screen.getByTestId('application-delete-btn');
		fireEvent.click(deleteBtn);

		const deletionBannerTitle = screen.getByTestId(
			'resource-deletion-title',
		);
		expect(deletionBannerTitle).toBeInTheDocument();

		const deletionInput = screen.getByTestId('resource-deletion-input');
		fireEvent.change(deletionInput, {
			target: { value: applications[1].name },
		});

		handleDeleteApplicationSpy.mockImplementationOnce(() => {
			throw new ApiError('unable to delete application', {
				statusCode: 401,
				statusText: 'Bad Request',
			});
		});

		const deletionBannerDeleteBtn = screen.getByTestId(
			'resource-deletion-delete-btn',
		);
		fireEvent.click(deletionBannerDeleteBtn);

		const errorToast = screen.getByText('unable to delete application');
		expect(errorToast.className).toContain(ToastType.ERROR);
	});

	it('calls usePageTracking hook with application-settings-deletion', async () => {
		render(
			<ApplicationDeletion
				projectId={projects[0].id}
				application={applications[0]}
			/>,
		);
		expect(usePageTracking).toHaveBeenCalledWith(
			'application-settings-deletion',
		);
	});
});

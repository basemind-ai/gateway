import { fireEvent } from '@testing-library/react';
import {
	APIKeyFactory,
	ApplicationFactory,
	ProjectFactory,
	PromptConfigFactory,
} from 'tests/factories';
import { render, renderHook, screen, waitFor } from 'tests/test-utils';

import * as APIKeysAPI from '@/api/api-keys-api';
import * as PromptConfigAPI from '@/api/prompt-config-api';
import ApplicationPage from '@/app/[locale]/projects/[projectId]/applications/[applicationId]/page';
import { useSetProjectApplications, useSetProjects } from '@/stores/api-store';

describe('ApplicationPage', () => {
	const handleRetrievePromptConfigsSpy = vi.spyOn(
		PromptConfigAPI,
		'handleRetrievePromptConfigs',
	);
	const handleRetrieveAPIKeysSpy = vi.spyOn(
		APIKeysAPI,
		'handleRetrieveAPIKeys',
	);

	beforeAll(() => {
		HTMLDialogElement.prototype.showModal = vi.fn();
		HTMLDialogElement.prototype.close = vi.fn();
	});

	it('returns null when application is not present', () => {
		const {
			result: { current: setProjects },
		} = renderHook(useSetProjects);
		const projects = ProjectFactory.batchSync(1);
		setProjects(projects);

		render(
			<ApplicationPage
				params={{
					applicationId: '1',
					projectId: projects[0].id,
				}}
			/>,
		);

		const pageContainer = screen.queryByTestId('application-page');
		expect(pageContainer).not.toBeInTheDocument();
	});

	it('renders all 3 screens in tab navigation', async () => {
		const {
			result: { current: setProjects },
		} = renderHook(useSetProjects);
		const projects = await ProjectFactory.batch(1);
		setProjects(projects);

		const applications = await ApplicationFactory.batch(2);
		const {
			result: { current: setProjectApplications },
		} = renderHook(useSetProjectApplications);
		setProjectApplications(projects[0].id, applications);

		const promptConfigs = await PromptConfigFactory.batch(2);
		handleRetrievePromptConfigsSpy.mockResolvedValueOnce(promptConfigs);

		render(
			<ApplicationPage
				params={{
					applicationId: applications[0].id,
					projectId: projects[0].id,
				}}
			/>,
		);

		await waitFor(() => {
			const pageTitle = screen.getByTestId('navbar-container');
			expect(pageTitle.innerHTML).toContain(applications[0].name);
		});

		// 	Renders overview
		const analytics = screen.getByTestId('application-analytics-container');
		expect(analytics).toBeInTheDocument();
		const promptConfig = screen.getByTestId(
			'application-prompt-config-container',
		);
		expect(promptConfig).toBeInTheDocument();

		const [, settingsTab, apiKeysTab] =
			screen.getAllByTestId('tab-navigation-btn');

		handleRetrievePromptConfigsSpy.mockResolvedValueOnce(promptConfigs);
		fireEvent.click(settingsTab);
		// 	Renders Settings
		await waitFor(() => {
			const settings = screen.getByTestId(
				'application-general-settings-container',
			);
			expect(settings).toBeInTheDocument();
		});
		const appDeletion = screen.getByTestId(
			'application-deletion-container',
		);
		expect(appDeletion).toBeInTheDocument();

		handleRetrieveAPIKeysSpy.mockResolvedValueOnce(
			await APIKeyFactory.batch(2),
		);
		fireEvent.click(apiKeysTab);
		await waitFor(() => {
			const apiKeysTitle = screen.getByTestId('api-keys-title');
			expect(apiKeysTitle).toBeInTheDocument();
		});
	});
});

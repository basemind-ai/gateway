import { fireEvent } from '@testing-library/react';
import {
	ApplicationFactory,
	ProjectFactory,
	PromptConfigFactory,
	TokenFactory,
} from 'tests/factories';
import { render, renderHook, screen, waitFor } from 'tests/test-utils';
import { describe, expect } from 'vitest';

import * as PromptConfigAPI from '@/api/prompt-config-api';
import * as TokensAPI from '@/api/tokens-api';
import ApplicationPage from '@/app/projects/[projectId]/applications/[applicationId]/page';
import {
	useSetProjectApplications,
	useSetProjects,
} from '@/stores/project-store';

describe('ApplicationPage', () => {
	const handleRetrievePromptConfigsSpy = vi.spyOn(
		PromptConfigAPI,
		'handleRetrievePromptConfigs',
	);
	const handleRetrieveTokensSpy = vi.spyOn(TokensAPI, 'handleRetrieveTokens');

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
					projectId: projects[0].id,
					applicationId: applications[0].id,
				}}
			/>,
		);

		await waitFor(() => {
			const pageTitle = screen.getByTestId('application-page-title');
			expect(pageTitle.innerHTML).toContain(applications[0].name);
		});

		// 	Renders overview
		const analytics = screen.getByTestId('application-analytics-container');
		expect(analytics).toBeInTheDocument();
		const promptConfig = screen.getByTestId(
			'application-prompt-config-container',
		);
		expect(promptConfig).toBeInTheDocument();

		const [, settingsTab, tokensTab] =
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

		handleRetrieveTokensSpy.mockResolvedValueOnce(
			await TokenFactory.batch(2),
		);
		fireEvent.click(tokensTab);
		await waitFor(() => {
			const apiKeysTitle = screen.getByTestId('api-keys-title');
			expect(apiKeysTitle).toBeInTheDocument();
		});
	});
});

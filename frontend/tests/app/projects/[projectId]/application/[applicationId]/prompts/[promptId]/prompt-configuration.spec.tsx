import { fireEvent } from '@testing-library/react';
import {
	ApplicationFactory,
	ProjectFactory,
	PromptConfigFactory,
} from 'tests/factories';
import { render, renderHook, screen, waitFor } from 'tests/test-utils';
import { expect } from 'vitest';

import * as PromptConfigAPI from '@/api/prompt-config-api';
import PromptConfiguration from '@/app/projects/[projectId]/applications/[applicationId]/prompts/[promptConfigId]/page';
import { ApiError } from '@/errors';
import {
	useSetProjectApplications,
	useSetProjects,
	useSetPromptConfigs,
} from '@/stores/project-store';
import { ToastType } from '@/stores/toast-store';

describe('PromptConfiguration', () => {
	const handleRetrievePromptConfigsSpy = vi.spyOn(
		PromptConfigAPI,
		'handleRetrievePromptConfigs',
	);

	const {
		result: { current: setProjects },
	} = renderHook(useSetProjects);
	const projects = ProjectFactory.batchSync(1);
	setProjects(projects);

	const applications = ApplicationFactory.batchSync(1);
	const {
		result: { current: setProjectApplications },
	} = renderHook(useSetProjectApplications);
	setProjectApplications(projects[0].id, applications);

	const projectId = projects[0].id;
	const applicationId = applications[0].id;

	it('renders all 4 screens in tab navigation', async () => {
		const promptConfig = PromptConfigFactory.buildSync();
		handleRetrievePromptConfigsSpy.mockResolvedValueOnce([promptConfig]);

		render(
			<PromptConfiguration
				params={{
					projectId,
					applicationId,
					promptConfigId: promptConfig.id,
				}}
			/>,
		);

		await waitFor(() => {
			const pageTitle = screen.getByTestId('prompt-page-title');
			expect(pageTitle.innerHTML).toContain(promptConfig.name);
		});

		// 	Renders overview
		const analytics = screen.getByTestId('prompt-analytics-container');
		expect(analytics).toBeInTheDocument();

		const generalInfo = screen.getByTestId('prompt-general-info-container');
		expect(generalInfo).toBeInTheDocument();

		const promptName = screen.getByTestId('prompt-general-info-name');
		expect(promptName.innerHTML).toBe(promptConfig.name);

		// Renders Settings
		const [, settingsTab] = screen.getAllByTestId('tab-navigation-btn');
		fireEvent.click(settingsTab);

		const settingsContainer = screen.getByTestId(
			'prompt-general-settings-container',
		);
		expect(settingsContainer).toBeInTheDocument();

		// 	TODO: update this test when more tabs are added to navigation
	});

	it('shows loading when prompt config is being fetched', () => {
		const promptConfig = PromptConfigFactory.buildSync();
		handleRetrievePromptConfigsSpy.mockResolvedValueOnce([promptConfig]);

		render(
			<PromptConfiguration
				params={{
					projectId,
					applicationId,
					promptConfigId: promptConfig.id,
				}}
			/>,
		);

		const loading = screen.getByTestId('prompt-config-page-loading');
		expect(loading).toBeInTheDocument();
	});

	it('shows null when there is no prompt config available', async () => {
		const promptConfig = PromptConfigFactory.buildSync();
		handleRetrievePromptConfigsSpy.mockResolvedValueOnce([]);

		render(
			<PromptConfiguration
				params={{
					projectId,
					applicationId,
					promptConfigId: promptConfig.id,
				}}
			/>,
		);

		const loading = screen.getByTestId('prompt-config-page-loading');
		expect(loading).toBeInTheDocument();

		await waitFor(() => {
			const loading = screen.queryByTestId('prompt-config-page-loading');
			expect(loading).not.toBeInTheDocument();
		});

		const promptPage = screen.queryByTestId('prompt-page');
		expect(promptPage).not.toBeInTheDocument();
	});

	it('shows error when unable to fetch prompt config', () => {
		const promptConfig = PromptConfigFactory.buildSync();
		handleRetrievePromptConfigsSpy.mockImplementationOnce(() => {
			throw new ApiError('unable to fetch prompt configs', {
				statusCode: 401,
				statusText: 'Bad Request',
			});
		});

		render(
			<PromptConfiguration
				params={{
					projectId,
					applicationId,
					promptConfigId: promptConfig.id,
				}}
			/>,
		);

		const errorToast = screen.getByText('unable to fetch prompt configs');
		expect(errorToast.className).toContain(ToastType.ERROR);
	});

	it('does not make the prompt config API call when prompt config is already in store', () => {
		vi.resetAllMocks();
		const promptConfig = PromptConfigFactory.buildSync();

		const {
			result: { current: setPromptConfigs },
		} = renderHook(useSetPromptConfigs);
		setPromptConfigs(applicationId, [promptConfig]);

		render(
			<PromptConfiguration
				params={{
					projectId,
					applicationId,
					promptConfigId: promptConfig.id,
				}}
			/>,
		);

		const loading = screen.queryByTestId('prompt-config-page-loading');
		expect(loading).not.toBeInTheDocument();

		expect(handleRetrievePromptConfigsSpy).not.toBeCalled();
	});
});

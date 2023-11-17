import { fireEvent } from '@testing-library/react';
import {
	ApplicationFactory,
	OpenAIPromptConfigFactory,
	ProjectFactory,
} from 'tests/factories';
import { render, renderHook, screen, waitFor } from 'tests/test-utils';
import { expect } from 'vitest';

import * as PromptConfigAPI from '@/api/prompt-config-api';
import PromptConfiguration from '@/app/[locale]/projects/[projectId]/applications/[applicationId]/[configId]/page';
import { ApiError } from '@/errors';
import {
	useSetProjectApplications,
	useSetProjects,
	useSetPromptConfigs,
} from '@/stores/api-store';
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

	it('renders all screens in tab navigation', async () => {
		const promptConfig = OpenAIPromptConfigFactory.buildSync();
		handleRetrievePromptConfigsSpy.mockResolvedValueOnce([promptConfig]);

		render(
			<PromptConfiguration
				params={{
					applicationId,
					projectId,
					promptConfigId: promptConfig.id,
				}}
			/>,
		);

		await waitFor(() => {
			expect(
				screen.getByTestId('prompt-config-page-loading'),
			).toBeInTheDocument();
		});

		await waitFor(() => {
			expect(screen.getByTestId('prompt-page-title')).toBeInTheDocument();
		});

		const analytics = screen.getByTestId('prompt-analytics-container');
		expect(analytics).toBeInTheDocument();

		const generalInfo = screen.getByTestId('prompt-general-info-container');
		expect(generalInfo).toBeInTheDocument();

		const promptName = screen.getByTestId('prompt-general-info-name');
		expect(promptName.innerHTML).toBe(promptConfig.name);

		const tabs = screen.getAllByTestId('tab-navigation-btn');
		expect(tabs.length).toBe(3);

		const [, testingTab, settingsTab] = tabs;

		fireEvent.click(testingTab);
		const testingContainer = screen.getByTestId('prompt-testing-container');
		await waitFor(() => {
			expect(testingContainer).toBeInTheDocument();
		});

		fireEvent.click(settingsTab);
		const settingsContainer = screen.getByTestId(
			'prompt-general-settings-container',
		);
		await waitFor(() => {
			expect(settingsContainer).toBeInTheDocument();
		});
	});

	it('shows loading when prompt config is being fetched', () => {
		const promptConfig = OpenAIPromptConfigFactory.buildSync();
		handleRetrievePromptConfigsSpy.mockResolvedValueOnce([promptConfig]);

		render(
			<PromptConfiguration
				params={{
					applicationId,
					projectId,
					promptConfigId: promptConfig.id,
				}}
			/>,
		);

		const loading = screen.getByTestId('prompt-config-page-loading');
		expect(loading).toBeInTheDocument();
	});

	it('shows null when there is no prompt config available', async () => {
		const promptConfig = OpenAIPromptConfigFactory.buildSync();
		handleRetrievePromptConfigsSpy.mockResolvedValueOnce([]);

		render(
			<PromptConfiguration
				params={{
					applicationId,
					projectId,
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
		const promptConfig = OpenAIPromptConfigFactory.buildSync();
		handleRetrievePromptConfigsSpy.mockImplementationOnce(() => {
			throw new ApiError('unable to fetch prompt configs', {
				statusCode: 401,
				statusText: 'Bad Request',
			});
		});

		render(
			<PromptConfiguration
				params={{
					applicationId,
					projectId,
					promptConfigId: promptConfig.id,
				}}
			/>,
		);

		const errorToast = screen.getByText('unable to fetch prompt configs');
		expect(errorToast.className).toContain(ToastType.ERROR);
	});

	it('does not make the prompt config API call when prompt config is already in store', () => {
		vi.resetAllMocks();
		const promptConfig = OpenAIPromptConfigFactory.buildSync();

		const {
			result: { current: setPromptConfigs },
		} = renderHook(useSetPromptConfigs);
		setPromptConfigs(applicationId, [promptConfig]);

		render(
			<PromptConfiguration
				params={{
					applicationId,
					projectId,
					promptConfigId: promptConfig.id,
				}}
			/>,
		);

		const loading = screen.queryByTestId('prompt-config-page-loading');
		expect(loading).not.toBeInTheDocument();

		expect(handleRetrievePromptConfigsSpy).not.toBeCalled();
	});
});

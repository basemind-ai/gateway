import {
	ApplicationFactory,
	OpenAIPromptConfigFactory,
	ProjectFactory,
} from 'tests/factories';
import {
	fireEvent,
	render,
	renderHook,
	screen,
	waitFor,
} from 'tests/test-utils';

import * as PromptConfigAPI from '@/api/prompt-config-api';
import { PromptConfigDeletion } from '@/components/projects/[projectId]/applications/[applicationId]/configs/[configId]/prompt-config-deletion';
import { ApiError } from '@/errors';
import { usePageTracking } from '@/hooks/use-page-tracking';
import {
	useSetProjectApplications,
	useSetProjects,
	useSetPromptConfigs,
} from '@/stores/api-store';
import { ToastType } from '@/stores/toast-store';

describe('PromptDeletion', () => {
	const handleDeletePromptConfigSpy = vi.spyOn(
		PromptConfigAPI,
		'handleDeletePromptConfig',
	);

	const {
		result: { current: setProjects },
	} = renderHook(useSetProjects);
	const project = ProjectFactory.buildSync();
	setProjects([project]);

	const application = ApplicationFactory.buildSync();
	const {
		result: { current: setProjectApplications },
	} = renderHook(useSetProjectApplications);
	setProjectApplications(project.id, [application]);

	it('renders prompt config deletion component', () => {
		const promptConfig = OpenAIPromptConfigFactory.buildSync();
		const {
			result: { current: setPromptConfigs },
		} = renderHook(useSetPromptConfigs);
		setPromptConfigs(application.id, [promptConfig]);

		render(
			<PromptConfigDeletion
				projectId={project.id}
				applicationId={application.id}
				promptConfig={promptConfig}
			/>,
		);

		const rootContainer = screen.getByTestId('prompt-deletion-container');
		expect(rootContainer).toBeInTheDocument();
	});

	it('renders confirmation banner and deletes prompt config after entering input', async () => {
		const promptConfig = OpenAIPromptConfigFactory.buildSync();
		const {
			result: { current: setPromptConfigs },
		} = renderHook(useSetPromptConfigs);
		setPromptConfigs(application.id, [promptConfig]);

		render(
			<PromptConfigDeletion
				projectId={project.id}
				applicationId={application.id}
				promptConfig={promptConfig}
			/>,
		);

		const deleteBtn = screen.getByTestId('prompt-delete-btn');
		fireEvent.click(deleteBtn);

		const deletionBannerTitle = screen.getByTestId(
			'resource-deletion-title',
		);
		expect(deletionBannerTitle).toBeInTheDocument();

		const deletionInput = screen.getByTestId('resource-deletion-input');
		fireEvent.change(deletionInput, {
			target: { value: promptConfig.name },
		});
		const deletionBannerDeleteBtn = screen.getByTestId(
			'resource-deletion-delete-btn',
		);
		fireEvent.click(deletionBannerDeleteBtn);

		await waitFor(() => {
			expect(handleDeletePromptConfigSpy).toHaveBeenCalledOnce();
		});
	});

	it('shows error when unable to delete prompt config', async () => {
		const promptConfig = OpenAIPromptConfigFactory.buildSync();
		const {
			result: { current: setPromptConfigs },
		} = renderHook(useSetPromptConfigs);
		setPromptConfigs(application.id, [promptConfig]);

		render(
			<PromptConfigDeletion
				projectId={project.id}
				applicationId={application.id}
				promptConfig={promptConfig}
			/>,
		);
		const deleteBtn = screen.getByTestId('prompt-delete-btn');
		fireEvent.click(deleteBtn);

		const deletionBannerTitle = screen.getByTestId(
			'resource-deletion-title',
		);
		expect(deletionBannerTitle).toBeInTheDocument();

		const deletionInput = screen.getByTestId('resource-deletion-input');
		fireEvent.change(deletionInput, {
			target: { value: promptConfig.name },
		});

		handleDeletePromptConfigSpy.mockImplementationOnce(() => {
			throw new ApiError('unable to delete prompt config', {
				statusCode: 401,
				statusText: 'Bad Request',
			});
		});

		const deletionBannerDeleteBtn = screen.getByTestId(
			'resource-deletion-delete-btn',
		);
		fireEvent.click(deletionBannerDeleteBtn);

		const errorToast = screen.getByText('unable to delete prompt config');
		expect(errorToast.className).toContain(ToastType.ERROR);
	});

	it('calls usePageTracking hook with config-settings-deletion', async () => {
		const promptConfig = OpenAIPromptConfigFactory.buildSync();
		const {
			result: { current: setPromptConfigs },
		} = renderHook(useSetPromptConfigs);
		setPromptConfigs(application.id, [promptConfig]);

		render(
			<PromptConfigDeletion
				projectId={project.id}
				applicationId={application.id}
				promptConfig={promptConfig}
			/>,
		);

		await waitFor(() => {
			expect(usePageTracking).toHaveBeenCalledWith(
				'config-settings-deletion',
			);
		});
	});
});

import { fireEvent, screen, waitFor } from '@testing-library/react';
import {
	ApplicationFactory,
	OpenAIPromptConfigFactory,
	ProjectFactory,
} from 'tests/factories';
import { mockFetch } from 'tests/mocks';
import { render, renderHook } from 'tests/test-utils';
import { describe, expect } from 'vitest';

import * as PromptConfigAPI from '@/api/prompt-config-api';
import { PromptConfigTest } from '@/components/projects/[projectId]/applications/[applicationId]/config/[configId]/prompt-config-test';
import { useSetPromptConfigs } from '@/stores/api-store';

describe('PromptConfigTest', () => {
	it('should render headline', async () => {
		const project = await ProjectFactory.build();
		const application = await ApplicationFactory.build();
		const promptConfig = await OpenAIPromptConfigFactory.build();

		render(
			<PromptConfigTest
				applicationId={application.id}
				projectId={project.id}
				promptConfig={promptConfig}
				navigateToOverview={vi.fn()}
			/>,
		);
		expect(
			screen.getByTestId('config-edit-screen-title'),
		).toHaveTextContent(promptConfig.name);
	});

	it('saves an existing configuration', async () => {
		mockFetch.mockResolvedValueOnce({
			json: () => Promise.resolve(OpenAIPromptConfigFactory.buildSync()),
			ok: true,
		});
		const project = await ProjectFactory.build();
		const application = await ApplicationFactory.build();
		const promptConfig = await OpenAIPromptConfigFactory.build();
		const { result } = renderHook(() => useSetPromptConfigs());
		result.current(application.id, [promptConfig]);

		const navigateToOverview = vi.fn();

		render(
			<PromptConfigTest
				applicationId={application.id}
				projectId={project.id}
				promptConfig={promptConfig}
				navigateToOverview={navigateToOverview}
			/>,
		);

		const button = screen.getByTestId('prompt-config-test-create-button');
		await waitFor(() => {
			expect(button).toBeInTheDocument();
		});

		fireEvent.click(button);

		await waitFor(() => {
			expect(mockFetch).toHaveBeenCalled();
		});
		await waitFor(() => {
			expect(navigateToOverview).toHaveBeenCalled();
		});
	});

	it('shows warning modal when expected template variables are changed', async () => {
		const project = await ProjectFactory.build();
		const application = await ApplicationFactory.build();
		const promptConfig = await OpenAIPromptConfigFactory.build();

		const { result } = renderHook(() => useSetPromptConfigs());
		result.current(application.id, [
			{
				promptConfig,
			},
		]);

		render(
			<PromptConfigTest
				applicationId={application.id}
				projectId={project.id}
				promptConfig={promptConfig}
				navigateToOverview={vi.fn()}
			/>,
		);
		const sectionHeadline = screen.getByTestId(
			'test-prompt-config-view-template-headline',
		);

		await waitFor(() => {
			expect(sectionHeadline).toBeInTheDocument();
		});
		fireEvent.click(sectionHeadline);

		fireEvent.change(screen.getByTestId('prompt-message-editor'), {
			target: { value: 'update message with {newVariable}' },
		});
		fireEvent.click(screen.getByTestId('prompt-message-save'));
		fireEvent.click(screen.getByTestId('prompt-config-test-create-button'));

		await waitFor(() => {
			expect(
				screen.getByTestId('warning-modal-container'),
			).toBeInTheDocument();
		});
	});

	it('closes warning modal without saving changes when cancel is clicked', async () => {
		const handleCreatePromptConfigSpy = vi.spyOn(
			PromptConfigAPI,
			'handleCreatePromptConfig',
		);
		const handleUpdatePromptConfigSpy = vi.spyOn(
			PromptConfigAPI,
			'handleUpdatePromptConfig',
		);
		const project = await ProjectFactory.build();
		const application = await ApplicationFactory.build();
		const promptConfig = await OpenAIPromptConfigFactory.build();

		const { result } = renderHook(() => useSetPromptConfigs());
		result.current(application.id, [
			{
				promptConfig,
			},
		]);

		render(
			<PromptConfigTest
				applicationId={application.id}
				projectId={project.id}
				promptConfig={promptConfig}
				navigateToOverview={vi.fn()}
			/>,
		);
		const sectionHeadline = screen.getByTestId(
			'test-prompt-config-view-template-headline',
		);

		await waitFor(() => {
			expect(sectionHeadline).toBeInTheDocument();
		});
		fireEvent.click(sectionHeadline);

		fireEvent.change(screen.getByTestId('prompt-message-editor'), {
			target: { value: 'update message with {variable}' },
		});
		fireEvent.click(screen.getByTestId('prompt-message-save'));
		fireEvent.click(screen.getByTestId('prompt-config-test-create-button'));
		await waitFor(() => {
			expect(
				screen.getByTestId('warning-modal-continue-button'),
			).toBeInTheDocument();
		});
		fireEvent.click(screen.getByTestId('warning-modal-cancel-button'));

		await waitFor(() => {
			expect(
				screen.queryByTestId('warning-modal'),
			).not.toBeInTheDocument();
		});

		expect(handleCreatePromptConfigSpy).not.toHaveBeenCalled();
		expect(handleUpdatePromptConfigSpy).not.toHaveBeenCalled();
	});

	it('continue on warning model update model', async () => {
		const handleUpdatePromptConfigSpy = vi.spyOn(
			PromptConfigAPI,
			'handleUpdatePromptConfig',
		);
		const project = await ProjectFactory.build();
		const application = await ApplicationFactory.build();
		const promptConfig = await OpenAIPromptConfigFactory.build();

		const { result } = renderHook(() => useSetPromptConfigs());
		result.current(application.id, [
			{
				promptConfig,
			},
		]);

		render(
			<PromptConfigTest
				applicationId={application.id}
				projectId={project.id}
				promptConfig={promptConfig}
				navigateToOverview={vi.fn()}
			/>,
		);
		await waitFor(() => {
			fireEvent.click(
				screen.getByTestId('test-prompt-config-view-template-headline'),
			);
		});
		fireEvent.change(screen.getByTestId('prompt-message-editor'), {
			target: { value: 'update message with {variable}' },
		});
		fireEvent.click(screen.getByTestId('prompt-message-save'));
		fireEvent.click(screen.getByTestId('prompt-config-test-create-button'));
		await waitFor(() => {
			expect(
				screen.getByTestId('warning-modal-continue-button'),
			).toBeInTheDocument();
		});
		fireEvent.click(screen.getByTestId('warning-modal-continue-button'));

		await waitFor(() => {
			expect(
				screen.queryByTestId('warning-modal'),
			).not.toBeInTheDocument();
		});

		expect(handleUpdatePromptConfigSpy).toHaveBeenCalled();
	});
});
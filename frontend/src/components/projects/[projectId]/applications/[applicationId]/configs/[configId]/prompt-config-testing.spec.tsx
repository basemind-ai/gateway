import { faker } from '@faker-js/faker';
import {
	ApplicationFactory,
	OpenAIPromptConfigFactory,
	ProjectFactory,
} from 'tests/factories';
import { mockPage, mockReady, routerReplaceMock } from 'tests/mocks';
import {
	act,
	fireEvent,
	render,
	renderHook,
	screen,
	waitFor,
} from 'tests/test-utils';
import { expect, MockInstance } from 'vitest';

import * as promptConfigApi from '@/api/prompt-config-api';
import { PromptConfigTesting } from '@/components/projects/[projectId]/applications/[applicationId]/configs/[configId]/prompt-config-testing';
import { usePromptConfigs, useSetPromptConfigs } from '@/stores/api-store';
import { OpenAIModelType, PromptConfig } from '@/types';

describe('PromptConfigTesting tests', () => {
	const project = ProjectFactory.buildSync();
	const application = ApplicationFactory.buildSync();
	const promptConfigs = OpenAIPromptConfigFactory.batchSync(3);
	const promptConfig = promptConfigs[0];

	let handleCreatePromptConfigSpy: MockInstance;
	let handleUpdatePromptConfigSpy: MockInstance;

	beforeEach(() => {
		handleCreatePromptConfigSpy = vi.spyOn(
			promptConfigApi,
			'handleCreatePromptConfig',
		);
		handleUpdatePromptConfigSpy = vi.spyOn(
			promptConfigApi,
			'handleUpdatePromptConfig',
		);
	});

	const {
		result: { current: setPromptConfigs },
	} = renderHook(useSetPromptConfigs);

	it('renders the expected forms and buttons', async () => {
		render(
			<PromptConfigTesting
				applicationId={application.id}
				projectId={project.id}
				promptConfig={promptConfig}
			/>,
		);

		await waitFor(() => {
			expect(
				screen.getByTestId('prompt-config-test-container'),
			).toBeInTheDocument();
		});
		expect(screen.getByTestId('base-form-container')).toBeInTheDocument();
		expect(
			screen.getByTestId('prompt-config-testing-form'),
		).toBeInTheDocument();
		expect(
			screen.getByTestId('parameters-and-prompt-form-container'),
		).toBeInTheDocument();
	});

	it("opens the name modal when pressing 'save as new' and allows saving a new config", async () => {
		handleCreatePromptConfigSpy.mockResolvedValueOnce(
			OpenAIPromptConfigFactory.buildSync(),
		);

		render(
			<PromptConfigTesting
				applicationId={application.id}
				projectId={project.id}
				promptConfig={promptConfig}
			/>,
		);

		act(() => {
			setPromptConfigs(application.id, promptConfigs);
		});

		await waitFor(() => {
			expect(
				screen.getByTestId('prompt-config-test-container'),
			).toBeInTheDocument();
		});

		await waitFor(() => {
			expect(screen.getByTestId('modal-content')).toBeInTheDocument();
		});

		fireEvent.change(
			screen.getByTestId('prompt-config-save-as-new-name-input'),
			{ target: { value: faker.lorem.word({ length: 8 }) } },
		);

		fireEvent.click(screen.getByTestId('confirm-save-as-new-button'));
		await waitFor(() => {
			expect(routerReplaceMock).toHaveBeenCalledTimes(1);
		});

		const {
			result: { current: storeConfigs },
		} = renderHook(usePromptConfigs);
		expect(storeConfigs[application.id]!.length).toBe(4);
	});

	it("closes the name modal when pressing 'cancel'", async () => {
		render(
			<PromptConfigTesting
				applicationId={application.id}
				projectId={project.id}
				promptConfig={promptConfig}
			/>,
		);

		await waitFor(() => {
			expect(
				screen.getByTestId('prompt-config-test-container'),
			).toBeInTheDocument();
		});

		fireEvent.click(
			screen.getByTestId('prompt-config-test-save-as-new-button'),
		);

		await waitFor(() => {
			expect(
				screen.getByTestId('save-as-new-name-form'),
			).toBeInTheDocument();
		});

		const cancelButton = screen.getByTestId('cancel-save-as-new-button');
		expect(cancelButton).toBeInTheDocument();
		expect(cancelButton).toBeEnabled();

		fireEvent.click(cancelButton);

		const dialog: HTMLDialogElement = screen.getByTestId('dialog-modal');

		await waitFor(() => {
			expect(dialog.open).toBeFalsy();
		});
	});

	it('allows updating the existing prompt config when parameters change', async () => {
		const updatedPromptConfig = {
			...promptConfig,
			modelParameters: {
				...promptConfig.modelParameters,
				maxTokens: 100,
			},
		};

		act(() => {
			setPromptConfigs(application.id, promptConfigs);
		});

		render(
			<PromptConfigTesting
				applicationId={application.id}
				projectId={project.id}
				promptConfig={promptConfig}
			/>,
		);

		await waitFor(() => {
			expect(
				screen.getByTestId('prompt-config-test-container'),
			).toBeInTheDocument();
		});

		const updateButton = screen.getByTestId(
			'prompt-config-test-update-button',
		);
		expect(updateButton).toBeInTheDocument();

		const slider = screen.getByTestId('parameter-slider-maxTokens');
		fireEvent.change(slider, { target: { value: 100 } });

		handleUpdatePromptConfigSpy.mockResolvedValueOnce(updatedPromptConfig);

		fireEvent.click(updateButton);

		await waitFor(() => {
			expect(handleUpdatePromptConfigSpy).toHaveBeenCalledTimes(1);
		});

		const {
			result: { current: storeConfigs },
		} = renderHook(usePromptConfigs);

		expect(storeConfigs[application.id]!.length).toBe(3);
		expect(
			storeConfigs[application.id]!.find(
				(c: PromptConfig<any>) => c.id === promptConfig.id,
			)!.modelParameters.maxTokens,
		).toBe(100);
	});
	it('allows updating the existing prompt config when the model type changes', async () => {
		const updatedPromptConfig = {
			...promptConfig,
			modelType: OpenAIModelType.Gpt4,
		};

		act(() => {
			setPromptConfigs(application.id, promptConfigs);
		});

		render(
			<PromptConfigTesting
				applicationId={application.id}
				projectId={project.id}
				promptConfig={promptConfig}
			/>,
		);

		await waitFor(() => {
			expect(
				screen.getByTestId('prompt-config-test-container'),
			).toBeInTheDocument();
		});

		const updateButton = screen.getByTestId(
			'prompt-config-test-update-button',
		);
		expect(updateButton).toBeInTheDocument();

		const modelSelect = screen.getByTestId(
			'create-prompt-base-form-model-select',
		);
		fireEvent.change(modelSelect, {
			target: { value: OpenAIModelType.Gpt4 },
		});

		handleUpdatePromptConfigSpy.mockResolvedValueOnce(updatedPromptConfig);

		fireEvent.click(updateButton);

		await waitFor(() => {
			expect(handleUpdatePromptConfigSpy).toHaveBeenCalledTimes(1);
		});

		const {
			result: { current: storeConfigs },
		} = renderHook(usePromptConfigs);

		expect(storeConfigs[application.id]!.length).toBe(3);
		expect(
			storeConfigs[application.id]!.find(
				(c: PromptConfig<any>) => c.id === promptConfig.id,
			)!.modelType,
		).toBe(OpenAIModelType.Gpt4);
	});
	it('does not allow updating the existing prompt config when the expected variables change', async () => {
		act(() => {
			setPromptConfigs(application.id, promptConfigs);
		});

		render(
			<PromptConfigTesting
				applicationId={application.id}
				projectId={project.id}
				promptConfig={promptConfig}
			/>,
		);

		const draftMessageInput = screen.getByTestId(
			'parameters-and-prompt-form-message-textarea',
		);
		fireEvent.change(draftMessageInput, {
			target: { value: '{userInput}' },
		});

		const saveMsgButton = screen.getByTestId(
			'parameters-and-prompt-form-save-message-button',
		);
		expect(saveMsgButton).toBeEnabled();
		fireEvent.click(saveMsgButton);

		const updatePromptConfigButton = screen.getByTestId(
			'prompt-config-test-update-button',
		);

		await waitFor(() => {
			expect(updatePromptConfigButton).toBeDisabled();
		});
	});
	it('allows saving as new when the expected variables change', async () => {
		act(() => {
			setPromptConfigs(application.id, promptConfigs);
		});

		render(
			<PromptConfigTesting
				applicationId={application.id}
				projectId={project.id}
				promptConfig={promptConfig}
			/>,
		);

		const draftMessageInput = screen.getByTestId(
			'parameters-and-prompt-form-message-textarea',
		);
		fireEvent.change(draftMessageInput, {
			target: { value: '{userInput}' },
		});

		const saveMsgButton = screen.getByTestId(
			'parameters-and-prompt-form-save-message-button',
		);
		expect(saveMsgButton).toBeEnabled();
		fireEvent.click(saveMsgButton);

		const saveAsNewButton = screen.getByTestId(
			'prompt-config-test-save-as-new-button',
		);

		await waitFor(() => {
			expect(saveAsNewButton).toBeEnabled();
		});
	});
	it('calls mockPage hook with config-testing', async () => {
		render(
			<PromptConfigTesting
				applicationId={application.id}
				projectId={project.id}
				promptConfig={promptConfig}
			/>,
		);
		await waitFor(() => {
			expect(mockReady).toHaveBeenCalled();
		});
		await waitFor(() => {
			expect(mockPage).toHaveBeenCalledWith(
				'config_testing',
				expect.any(Object),
			);
		});
	});
});

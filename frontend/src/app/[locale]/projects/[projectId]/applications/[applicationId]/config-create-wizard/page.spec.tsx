import { faker } from '@faker-js/faker';
import { OpenAIPromptConfigFactory } from 'tests/factories';
import {
	mockFetch,
	mockPage,
	mockReady,
	mockTrack,
	routerPushMock,
	routerReplaceMock,
} from 'tests/mocks';
import {
	act,
	fireEvent,
	render,
	renderHook,
	screen,
	waitFor,
} from 'tests/test-utils';
import { shallow } from 'zustand/shallow';

import PromptConfigCreateWizard from '@/app/[locale]/projects/[projectId]/applications/[applicationId]/config-create-wizard/page';
import { ApiError } from '@/errors';
import { useResetState, useSetPromptConfigs } from '@/stores/api-store';
import {
	PromptConfigWizardStore,
	usePromptWizardStore,
	wizardStoreSelector,
} from '@/stores/prompt-config-wizard-store';
import { useToasts } from '@/stores/toast-store';
import { OpenAIPromptMessageRole, PromptTestRecord } from '@/types';

vi.mock('@/hooks/use-prompt-testing', () => ({
	usePromptTesting: vi.fn(() => ({
		isRunningTest: false,
		modelResponses: [],
		sendMessage: vi.fn(),
		testFinishReason: '',
		testRecord: {} as PromptTestRecord<any>,
	})),
}));

vi.mock('swr', async (importOriginal: () => Promise<Record<string, any>>) => {
	const original = await importOriginal();

	return {
		...original,
		default: vi.fn(() => ({
			isLoading: false,
		})),
	};
});

const getStore = (): PromptConfigWizardStore => {
	const { result } = renderHook(() =>
		usePromptWizardStore(wizardStoreSelector, shallow),
	);
	return result.current;
};

describe('PromptConfigCreateWizard Page tests', () => {
	const applicationId = faker.string.uuid();
	const projectId = faker.string.uuid();

	const {
		result: { current: resetAPIStore },
	} = renderHook(useResetState);

	afterEach(() => {
		getStore().resetState();
		mockFetch.mockReset();
		resetAPIStore();
	});

	it('should render the name and model form for wizard stage 0', () => {
		render(
			<PromptConfigCreateWizard params={{ applicationId, projectId }} />,
		);

		const form = screen.getByTestId('base-form-container');
		expect(form).toBeInTheDocument();
	});

	it('does not allow the user to continue to the second stage if the config name is not set', () => {
		render(
			<PromptConfigCreateWizard params={{ applicationId, projectId }} />,
		);

		const continueButton = screen.getByTestId(
			'config-create-wizard-continue-button',
		);
		expect(continueButton).toBeInTheDocument();
		expect(continueButton).toBeDisabled();
	});

	it('does not allow the user to continue to the second stage if the name is not unique', () => {
		const promptConfigs = OpenAIPromptConfigFactory.batchSync(2);
		const {
			result: { current: setPromptConfigs },
		} = renderHook(useSetPromptConfigs);

		act(() => {
			setPromptConfigs(applicationId, promptConfigs);
		});

		const store = getStore();
		store.setConfigName(promptConfigs[0].name);

		render(
			<PromptConfigCreateWizard params={{ applicationId, projectId }} />,
		);

		const continueButton = screen.getByTestId(
			'config-create-wizard-continue-button',
		);
		expect(continueButton).toBeInTheDocument();
		expect(continueButton).toBeDisabled();
	});

	it('allows the user to continue to the second stage if the name is set and is unique', async () => {
		const promptConfigs = OpenAIPromptConfigFactory.batchSync(2);
		const {
			result: { current: setPromptConfigs },
		} = renderHook(useSetPromptConfigs);

		act(() => {
			setPromptConfigs(applicationId, promptConfigs);
		});

		render(
			<PromptConfigCreateWizard params={{ applicationId, projectId }} />,
		);

		const input = screen.getByTestId('create-prompt-base-form-name-input');
		expect(input).toBeInTheDocument();

		const continueButton = screen.getByTestId(
			'config-create-wizard-continue-button',
		);
		expect(continueButton).toBeInTheDocument();
		expect(continueButton).toBeDisabled();

		fireEvent.change(input, {
			target: { value: faker.lorem.word({ length: 5 }) },
		});

		await waitFor(() => {
			expect(continueButton).not.toBeDisabled();
		});
	});

	it('does not allow the user to continue to the third stage if messages are empty', async () => {
		const store = getStore();
		act(() => {
			store.setConfigName(faker.lorem.word());
		});

		render(
			<PromptConfigCreateWizard params={{ applicationId, projectId }} />,
		);

		const continueButton = screen.getByTestId(
			'config-create-wizard-continue-button',
		);
		expect(continueButton).toBeInTheDocument();

		await waitFor(() => {
			expect(continueButton).not.toBeDisabled();
		});

		fireEvent.click(continueButton);

		await waitFor(() => {
			expect(
				screen.getByTestId('parameters-and-prompt-form-container'),
			).toBeInTheDocument();
		});
		expect(continueButton).toBeDisabled();
	});

	it('does not allow the user to save the config if messages are empty', async () => {
		const promptConfig = OpenAIPromptConfigFactory.buildSync();
		mockFetch.mockResolvedValue({
			json: () => Promise.resolve(promptConfig),
			ok: true,
		});

		const store = getStore();
		act(() => {
			store.setConfigName(faker.lorem.word());
			store.setMessages([]);
			store.setParameters(promptConfig.modelParameters);
			store.setModelType(promptConfig.modelType);
			store.setModelVendor(promptConfig.modelVendor);
			store.setNextWizardStage();
			store.setNextWizardStage();
		});

		render(
			<PromptConfigCreateWizard params={{ applicationId, projectId }} />,
		);

		await waitFor(() => {
			expect(
				screen.getByTestId('prompt-config-testing-form'),
			).toBeInTheDocument();
		});

		const saveButton = screen.getByTestId(
			'config-create-wizard-save-button',
		);
		expect(saveButton).toBeInTheDocument();
		expect(saveButton).toBeDisabled();
	});

	it('allows the user to continue to the third stage if messages are not empty', async () => {
		const store = getStore();
		act(() => {
			store.setConfigName(faker.lorem.word());
			store.setMessages([
				{ content: 'test', role: OpenAIPromptMessageRole.User },
			]);
		});

		render(
			<PromptConfigCreateWizard params={{ applicationId, projectId }} />,
		);

		const continueButton = screen.getByTestId(
			'config-create-wizard-continue-button',
		);
		expect(continueButton).toBeInTheDocument();
		await waitFor(() => {
			expect(continueButton).not.toBeDisabled();
		});

		fireEvent.click(continueButton);

		await waitFor(() => {
			expect(
				screen.getByTestId('parameters-and-prompt-form-container'),
			).toBeInTheDocument();
		});

		expect(continueButton).not.toBeDisabled();
		fireEvent.click(continueButton);

		await waitFor(() => {
			expect(
				screen.getByTestId('prompt-config-testing-form'),
			).toBeInTheDocument();
		});
	});

	it('allows the user to save the config when on the third stage and replaces the route', async () => {
		const promptConfig = OpenAIPromptConfigFactory.buildSync();
		mockFetch.mockResolvedValue({
			json: () => Promise.resolve(promptConfig),
			ok: true,
		});

		const store = getStore();
		act(() => {
			store.setConfigName(promptConfig.name);
			store.setMessages(promptConfig.providerPromptMessages);
			store.setParameters(promptConfig.modelParameters);
			store.setModelType(promptConfig.modelType);
			store.setModelVendor(promptConfig.modelVendor);
			store.setNextWizardStage();
			store.setNextWizardStage();
		});

		render(
			<PromptConfigCreateWizard params={{ applicationId, projectId }} />,
		);

		await waitFor(() => {
			expect(
				screen.getByTestId('prompt-config-testing-form'),
			).toBeInTheDocument();
		});

		const saveButton = screen.getByTestId(
			'config-create-wizard-save-button',
		);
		expect(saveButton).toBeInTheDocument();
		expect(saveButton).not.toBeDisabled();

		fireEvent.click(saveButton);

		await waitFor(() => {
			expect(mockFetch).toHaveBeenCalledTimes(1);
		});

		await waitFor(() => {
			expect(routerReplaceMock).toHaveBeenCalledOnce();
		});
	});

	it('shows an error message when save fails', async () => {
		const promptConfig = OpenAIPromptConfigFactory.buildSync();

		mockFetch.mockResolvedValueOnce({
			json: () =>
				Promise.reject(
					new ApiError('failed', {
						context: {},
						statusCode: 500,
						statusText: 'failed',
					}),
				),
			ok: false,
		});

		const store = getStore();
		act(() => {
			store.setConfigName(promptConfig.name);
			store.setMessages(promptConfig.providerPromptMessages);
			store.setParameters(promptConfig.modelParameters);
			store.setModelType(promptConfig.modelType);
			store.setModelVendor(promptConfig.modelVendor);
			store.setNextWizardStage();
			store.setNextWizardStage();
		});
		render(
			<PromptConfigCreateWizard params={{ applicationId, projectId }} />,
		);

		await waitFor(() => {
			expect(
				screen.getByTestId('prompt-config-testing-form'),
			).toBeInTheDocument();
		});

		const saveButton = screen.getByTestId(
			'config-create-wizard-save-button',
		);
		expect(saveButton).toBeInTheDocument();
		expect(saveButton).not.toBeDisabled();

		fireEvent.click(saveButton);

		await waitFor(() => {
			expect(mockFetch).toHaveBeenCalledTimes(1);
		});

		const {
			result: { current: toasts },
		} = renderHook(useToasts);

		await waitFor(() => {
			expect(toasts[0].message).toBe('Something went wrong');
		});
	});

	it('allows the user to press back from the third stage up to the first stage', async () => {
		const promptConfig = OpenAIPromptConfigFactory.buildSync();

		const store = getStore();
		act(() => {
			store.setConfigName(promptConfig.name);
			store.setMessages(promptConfig.providerPromptMessages);
			store.setParameters(promptConfig.modelParameters);
			store.setModelType(promptConfig.modelType);
			store.setModelVendor(promptConfig.modelVendor);
			store.setNextWizardStage();
			store.setNextWizardStage();
		});
		render(
			<PromptConfigCreateWizard params={{ applicationId, projectId }} />,
		);

		await waitFor(() => {
			expect(
				screen.getByTestId('prompt-config-testing-form'),
			).toBeInTheDocument();
		});

		const backButton = screen.getByTestId(
			'config-create-wizard-back-button',
		);
		expect(backButton).toBeInTheDocument();
		expect(backButton).not.toBeDisabled();

		fireEvent.click(backButton);

		await waitFor(() => {
			expect(
				screen.getByTestId('parameters-and-prompt-form-container'),
			).toBeInTheDocument();
		});

		fireEvent.click(backButton);

		await waitFor(() => {
			expect(
				screen.getByTestId('base-form-container'),
			).toBeInTheDocument();
		});
	});

	it('does not render the back button on stage 0', async () => {
		render(
			<PromptConfigCreateWizard params={{ applicationId, projectId }} />,
		);

		await waitFor(() => {
			expect(
				screen.getByTestId('base-form-container'),
			).toBeInTheDocument();
		});

		const backButton = screen.queryAllByTestId(
			'config-create-wizard-back-button',
		);
		expect(backButton.length).toBeFalsy();
	});

	it('does not render the continue button on stage 3', async () => {
		const promptConfig = OpenAIPromptConfigFactory.buildSync();

		const store = getStore();
		act(() => {
			store.setConfigName(promptConfig.name);
			store.setMessages(promptConfig.providerPromptMessages);
			store.setParameters(promptConfig.modelParameters);
			store.setModelType(promptConfig.modelType);
			store.setModelVendor(promptConfig.modelVendor);
			store.setNextWizardStage();
			store.setNextWizardStage();
		});
		render(
			<PromptConfigCreateWizard params={{ applicationId, projectId }} />,
		);

		await waitFor(() => {
			expect(
				screen.getByTestId('prompt-config-testing-form'),
			).toBeInTheDocument();
		});

		const continueButton = screen.queryAllByTestId(
			'config-create-wizard-continue-button',
		);
		expect(continueButton.length).toBeFalsy();
	});

	it('allows the user to cancel only on the first stage', async () => {
		const promptConfig = OpenAIPromptConfigFactory.buildSync();

		const store = getStore();
		act(() => {
			store.setConfigName(promptConfig.name);
			store.setMessages(promptConfig.providerPromptMessages);
			store.setParameters(promptConfig.modelParameters);
			store.setModelType(promptConfig.modelType);
			store.setModelVendor(promptConfig.modelVendor);
			store.setNextWizardStage();
			store.setNextWizardStage();
		});
		render(
			<PromptConfigCreateWizard params={{ applicationId, projectId }} />,
		);

		await waitFor(() => {
			expect(
				screen.getByTestId('prompt-config-testing-form'),
			).toBeInTheDocument();
		});

		let cancelButton = screen.queryByTestId(
			'config-create-wizard-cancel-button',
		);
		expect(cancelButton).toBeNull();

		act(() => {
			store.setPrevWizardStage();
		});

		await waitFor(() => {
			expect(
				screen.getByTestId('parameters-and-prompt-form-container'),
			).toBeInTheDocument();
		});

		cancelButton = screen.queryByTestId(
			'config-create-wizard-cancel-button',
		);
		expect(cancelButton).toBeNull();

		act(() => {
			store.setPrevWizardStage();
		});

		await waitFor(() => {
			expect(
				screen.getByTestId('base-form-container'),
			).toBeInTheDocument();
		});
		cancelButton = screen.getByTestId('config-create-wizard-cancel-button');
		expect(cancelButton).not.toBeDisabled();

		fireEvent.click(cancelButton);

		expect(routerPushMock).toHaveBeenCalledTimes(1);
	});

	it('shows the provider key create modal when no provider key exists for the given vendor', async () => {
		const promptConfig = OpenAIPromptConfigFactory.buildSync();

		const store = getStore();
		act(() => {
			store.setConfigName(promptConfig.name);
			store.setMessages(promptConfig.providerPromptMessages);
			store.setParameters(promptConfig.modelParameters);
			store.setModelType(promptConfig.modelType);
			store.setModelVendor(promptConfig.modelVendor);
			store.setNextWizardStage();
		});

		render(
			<PromptConfigCreateWizard params={{ applicationId, projectId }} />,
		);

		await waitFor(() => {
			expect(
				screen.getByTestId('parameters-and-prompt-form-container'),
			).toBeInTheDocument();
		});
	});

	it('calls usePageTracking hook with the stage number', async () => {
		const promptConfig = OpenAIPromptConfigFactory.batchSync(1);

		const store = getStore();
		act(() => {
			store.setConfigName(promptConfig[0].name);
			store.setMessages(promptConfig[0].providerPromptMessages);
			store.setParameters(promptConfig[0].modelParameters);
			store.setModelType(promptConfig[0].modelType);
			store.setModelVendor(promptConfig[0].modelVendor);
			store.setMessages([]);
		});

		render(
			<PromptConfigCreateWizard params={{ applicationId, projectId }} />,
		);
		await waitFor(() => {
			expect(mockReady).toHaveBeenCalled();
		});

		expect(mockPage).toBeCalledWith(
			'createConfigWizard',
			expect.any(Object),
		);

		act(() => {
			store.setNextWizardStage();
		});
		await waitFor(() => {
			expect(mockPage).toHaveBeenCalledWith(
				`createConfigWizard`,
				expect.any(Object),
			);
		});

		act(() => {
			store.setNextWizardStage();
		});
		await waitFor(() => {
			expect(mockPage).toHaveBeenCalledWith(
				`createConfigWizard`,
				expect.any(Object),
			);
		});
	});

	it('calls useTrackEvent when the user saves the config', async () => {
		const promptConfig = OpenAIPromptConfigFactory.batchSync(1);

		const store = getStore();
		act(() => {
			store.setConfigName(promptConfig[0].name);
			store.setMessages(promptConfig[0].providerPromptMessages);
			store.setParameters(promptConfig[0].modelParameters);
			store.setModelType(promptConfig[0].modelType);
			store.setModelVendor(promptConfig[0].modelVendor);
			store.setNextWizardStage();
			store.setNextWizardStage();
		});

		render(
			<PromptConfigCreateWizard params={{ applicationId, projectId }} />,
		);

		const saveButton = screen.getByTestId(
			'config-create-wizard-save-button',
		);
		expect(saveButton).toBeInTheDocument();
		fireEvent.click(saveButton);

		await waitFor(() => {
			expect(mockTrack).toHaveBeenCalledWith(
				'createConfig',
				expect.any(Object),
			);
		});
	});
});

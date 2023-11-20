import { faker } from '@faker-js/faker';
import { OpenAIPromptConfigFactory } from 'tests/factories';
import { mockFetch, routerPushMock, routerReplaceMock } from 'tests/mocks';
import {
	act,
	fireEvent,
	render,
	renderHook,
	screen,
	waitFor,
} from 'tests/test-utils';
import { afterEach, expect } from 'vitest';
import { shallow } from 'zustand/shallow';

import PromptConfigCreateWizard from '@/app/[locale]/projects/[projectId]/applications/[applicationId]/config-create-wizard/page';
import { useSetPromptConfigs } from '@/stores/api-store';
import {
	PromptConfigWizardStore,
	usePromptWizardStore,
	wizardStoreSelector,
} from '@/stores/prompt-config-wizard-store';
import { PromptTestRecord } from '@/types';

vi.mock('@/hooks/use-prompt-testing', () => ({
	usePromptTesting: vi.fn(() => ({
		isRunningTest: false,
		modelResponses: [],
		sendMessage: vi.fn(),
		testFinishReason: '',
		testRecord: {} as PromptTestRecord<any>,
	})),
}));

const getStore = (): PromptConfigWizardStore => {
	const { result } = renderHook(() =>
		usePromptWizardStore(wizardStoreSelector, shallow),
	);
	return result.current;
};

describe('PromptConfigCreateWizard Page tests', () => {
	const applicationId = faker.string.uuid();
	const projectId = faker.string.uuid();

	afterEach(() => {
		getStore().resetState();
		mockFetch.mockReset();
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

		setPromptConfigs(applicationId, promptConfigs);

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

	it('allows the user to continue to the second stage if the name is set and is unique', () => {
		const promptConfigs = OpenAIPromptConfigFactory.batchSync(2);
		const {
			result: { current: setPromptConfigs },
		} = renderHook(useSetPromptConfigs);

		setPromptConfigs(applicationId, promptConfigs);

		const store = getStore();
		store.setConfigName(faker.lorem.word());

		render(
			<PromptConfigCreateWizard params={{ applicationId, projectId }} />,
		);

		const continueButton = screen.getByTestId(
			'config-create-wizard-continue-button',
		);
		expect(continueButton).toBeInTheDocument();
		expect(continueButton).not.toBeDisabled();
	});

	it('does not allow the user to continue to the third stage if messages are empty', async () => {
		const store = getStore();
		store.setConfigName(faker.lorem.word());

		render(
			<PromptConfigCreateWizard params={{ applicationId, projectId }} />,
		);

		const continueButton = screen.getByTestId(
			'config-create-wizard-continue-button',
		);
		expect(continueButton).toBeInTheDocument();
		expect(continueButton).not.toBeDisabled();

		fireEvent.click(continueButton);

		await waitFor(() => {
			expect(
				screen.getByTestId('parameters-and-prompt-form-container'),
			).toBeInTheDocument();
		});
		expect(continueButton).toBeDisabled();
	});

	it('does not allow the user to save the config if messages are empty', async () => {
		const store = getStore();
		store.setConfigName(faker.lorem.word());

		render(
			<PromptConfigCreateWizard params={{ applicationId, projectId }} />,
		);

		const continueButton = screen.getByTestId(
			'config-create-wizard-continue-button',
		);
		expect(continueButton).toBeInTheDocument();
		fireEvent.click(continueButton);

		await waitFor(() => {
			expect(
				screen.getByTestId('parameters-and-prompt-form-container'),
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
			store.setMessages([{ content: 'test', role: 'user' }]);
		});

		render(
			<PromptConfigCreateWizard params={{ applicationId, projectId }} />,
		);

		const continueButton = screen.getByTestId(
			'config-create-wizard-continue-button',
		);
		expect(continueButton).toBeInTheDocument();
		expect(continueButton).not.toBeDisabled();
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

	it('allows the user to save the config if messages are not empty and replaces the route', async () => {
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
		});
		render(
			<PromptConfigCreateWizard params={{ applicationId, projectId }} />,
		);

		const continueButton = screen.getByTestId(
			'config-create-wizard-continue-button',
		);
		expect(continueButton).toBeInTheDocument();
		fireEvent.click(continueButton);

		await waitFor(() => {
			expect(
				screen.getByTestId('parameters-and-prompt-form-container'),
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

		expect(routerReplaceMock).toHaveBeenCalledOnce();
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

	it('allows the user to cancel at all stages', async () => {
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
		const cancelButton = screen.getByTestId(
			'config-create-wizard-cancel-button',
		);
		expect(cancelButton).toBeInTheDocument();
		expect(cancelButton).not.toBeDisabled();

		fireEvent.click(cancelButton);

		expect(routerPushMock).toHaveBeenCalledOnce();

		act(() => {
			store.setPrevWizardStage();
		});

		await waitFor(() => {
			expect(
				screen.getByTestId('parameters-and-prompt-form-container'),
			).toBeInTheDocument();
		});

		expect(cancelButton).not.toBeDisabled();

		fireEvent.click(cancelButton);

		expect(routerPushMock).toHaveBeenCalledTimes(2);

		act(() => {
			store.setPrevWizardStage();
		});

		await waitFor(() => {
			expect(
				screen.getByTestId('base-form-container'),
			).toBeInTheDocument();
		});

		expect(cancelButton).not.toBeDisabled();

		fireEvent.click(cancelButton);

		expect(routerPushMock).toHaveBeenCalledTimes(3);
	});
});

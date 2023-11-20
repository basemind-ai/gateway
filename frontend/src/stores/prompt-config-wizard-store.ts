/* eslint-disable @typescript-eslint/unbound-method */
import { StateCreator } from 'zustand';
import { createWithEqualityFn } from 'zustand/traditional';

import {
	ModelParameters,
	ModelType,
	ModelVendor,
	OpenAIModelType,
	PromptTestRecord,
	ProviderMessageType,
} from '@/types';

export enum WizardStage {
	NAME_AND_MODEL,
	PARAMETERS_AND_PROMPT,
	TEST,
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PromptConfigWizardStore {
	configName: string;
	messages: ProviderMessageType<any>[];
	modelType: ModelType<any>;
	modelVendor: ModelVendor;
	parameters: ModelParameters<any>;
	resetState(): void;
	setConfigName(configName: string): void;
	setMessages(messages: ProviderMessageType<any>[]): void;
	setModelType(modelType: ModelType<any>): void;
	setModelVendor(modelVendor: any): void;
	setNextWizardStage(): void;
	setParameters(parameters: ModelParameters<any>): void;
	setPrevWizardStage(): void;
	setTemplateVariables(templateVariables: Record<string, string>): void;
	setTestName(testName: string): void;
	setTestRecord(testRecord: PromptTestRecord<any>): void;
	templateVariables: Record<string, string>;
	testName?: string;
	testRecord?: PromptTestRecord<any>;
	wizardStage: WizardStage;
}

const initialState = {
	configName: '',
	messages: [],
	modelType: OpenAIModelType.Gpt35Turbo,
	modelVendor: ModelVendor.OpenAI,
	parameters: {},
	templateVariables: {},
	wizardStage: WizardStage.NAME_AND_MODEL,
};

export const promptConfigWizardStoreStateCreator: StateCreator<
	PromptConfigWizardStore
> = (set, get) => ({
	...initialState,
	resetState() {
		set(structuredClone(initialState));
	},
	setConfigName: (configName: string) => {
		set({ configName });
	},
	setMessages: (messages: ProviderMessageType<any>[]) => {
		set({ messages });
	},
	setModelType: (modelType: ModelType<any>) => {
		set({ modelType });
	},
	setModelVendor: (modelVendor: ModelVendor) => {
		set({ modelVendor });
	},
	setNextWizardStage: () => {
		set({ wizardStage: get().wizardStage + 1 });
	},
	setParameters: (parameters: ModelParameters<any>) => {
		set({ parameters });
	},
	setPrevWizardStage: () => {
		set({ wizardStage: get().wizardStage - 1 });
	},
	setTemplateVariables: (templateVariables: Record<string, string>) => {
		set({ templateVariables });
	},
	setTestName: (testName: string) => {
		set({ testName });
	},
	setTestRecord: (testRecord: PromptTestRecord<any>) => {
		set({ testRecord });
	},
});

export const usePromptWizardStore = createWithEqualityFn(
	promptConfigWizardStoreStateCreator,
);

export const wizardStoreSelector = (s: PromptConfigWizardStore) => ({
	configName: s.configName,
	messages: s.messages,
	modelType: s.modelType,
	modelVendor: s.modelVendor,
	parameters: s.parameters,
	resetState: s.resetState,
	setConfigName: s.setConfigName,
	setMessages: s.setMessages,
	setModelType: s.setModelType,
	setModelVendor: s.setModelVendor,
	setNextWizardStage: s.setNextWizardStage,
	setParameters: s.setParameters,
	setPrevWizardStage: s.setPrevWizardStage,
	setTemplateVariables: s.setTemplateVariables,
	templateVariables: s.templateVariables,
	wizardStage: s.wizardStage,
});

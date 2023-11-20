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
	isNewConfig: boolean;
	messages: ProviderMessageType<any>[];
	modelType: ModelType<any>;
	modelVendor: ModelVendor;
	parameters: ModelParameters<any>;
	resetState(): void;
	setConfigName(configName: string): void;
	setIsNewConfig(isNewConfig: boolean): void;
	setMessages(messages: ProviderMessageType<any>[]): void;
	setModelType(modelType: ModelType<any>): void;
	setModelVendor(modelVendor: any): void;
	setNextWizardStage(): void;
	setParameters(parameters: ModelParameters<any>): void;
	setPrevWizardStage(): void;
	setTemplateVariables(templateVariables: Record<string, string>): void;
	setTestName(testName: string): void;
	setTestRecord(testRecord: PromptTestRecord<any>): void;
	setTestResult(testResult: string): void;
	templateVariables: Record<string, string>;
	testName?: string;
	testRecord?: PromptTestRecord<any>;
	testResult?: string;
	wizardStage: WizardStage;
}

const initialState = {
	configName: '',
	isNewConfig: true,
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
	setIsNewConfig: (isNewConfig: boolean) => {
		set({ isNewConfig });
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
	setTestResult: (testResult: string) => {
		set({ testResult });
	},
});

export const usePromptWizardStore = createWithEqualityFn(
	promptConfigWizardStoreStateCreator,
);

import {
	CohereModelType,
	ModelType,
	ModelVendor,
	OpenAIModelType,
} from '@/types';

const openAIIcon = 'openAI-icon.svg';
const cohereIcon = 'cohere-icon.svg';

export const OPEN_AI_MAX_TOKENS = 2048;
export const DEFAULT_MAX_TOKENS = 256;

export const modelVendorsTranslationKeyMap: Record<ModelVendor, string> = {
	[ModelVendor.OpenAI]: 'openai',
	[ModelVendor.Cohere]: 'cohere',
};

export const vendorImageSourceMap: Record<ModelVendor, string> = {
	[ModelVendor.OpenAI]: `/images/${openAIIcon}`,
	[ModelVendor.Cohere]: `/images/${cohereIcon}`,
};

export const modelTypeToNameMap: Record<ModelType<any>, string> = {
	[OpenAIModelType.Gpt35Turbo]: 'GPT-3.5 Turbo',
	[OpenAIModelType.Gpt3516K]: 'GPT-3.5 Turbo 16K',
	[OpenAIModelType.Gpt4]: 'GPT-4',
	[OpenAIModelType.Gpt432K]: 'GPT-4 32K',
	[CohereModelType.Command]: 'Command',
	[CohereModelType.CommandLight]: 'Command Light',
	[CohereModelType.CommandNightly]: 'Command Nightly',
	[CohereModelType.CommandLightNightly]: 'Command Light Nightly',
};

export enum UnavailableModelVendor {
	A21Labs = 'A21_LABS',
	Anthropic = 'ANTHROPIC',
	Cohere = 'COHERE',
	Google = 'GOOGLE',
}

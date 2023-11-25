import {
	CohereModelType,
	ModelType,
	ModelVendor,
	OpenAIModelType,
} from '@/types';

const openAIIcon = 'openAI-icon.svg';
const cohereIcon = 'cohere-icon.svg';

export const DEFAULT_MAX_TOKENS = 256;

export const openAIModelsMaxTokensMap: Record<OpenAIModelType, number> = {
	[OpenAIModelType.Gpt35Turbo]: 4096,
	[OpenAIModelType.Gpt3516K]: 16_384,
	[OpenAIModelType.Gpt4]: 16_384,
	[OpenAIModelType.Gpt432K]: 32_768,
};

export const modelVendorToLocaleMap: Record<ModelVendor, string> = {
	[ModelVendor.OpenAI]: 'OpenAI',
	[ModelVendor.Cohere]: 'Cohere',
};

export const vendorImageSourceMap: Record<ModelVendor, string> = {
	[ModelVendor.OpenAI]: `/images/${openAIIcon}`,
	[ModelVendor.Cohere]: `/images/${cohereIcon}`,
};

export const modelTypeToLocaleMap: Record<ModelType<any>, string> = {
	[OpenAIModelType.Gpt35Turbo]: 'GPT-3.5 Turbo',
	[OpenAIModelType.Gpt3516K]: 'GPT-3.5 Turbo 16K',
	[OpenAIModelType.Gpt4]: 'GPT-4',
	[OpenAIModelType.Gpt432K]: 'GPT-4 32K',
	[CohereModelType.Command]: 'Command',
	[CohereModelType.CommandLight]: 'Command Light',
	[CohereModelType.CommandNightly]: 'Command Nightly',
	[CohereModelType.CommandLightNightly]: 'Command Light Nightly',
};

type TModelType = typeof OpenAIModelType | typeof CohereModelType;

export const modelVendorTypeMap: Record<ModelVendor, TModelType> = {
	[ModelVendor.OpenAI]: OpenAIModelType,
	[ModelVendor.Cohere]: CohereModelType,
};

export enum UnavailableModelVendor {
	A21Labs = 'A21_LABS',
	Anthropic = 'ANTHROPIC',
	Cohere = 'COHERE',
	Google = 'GOOGLE',
}

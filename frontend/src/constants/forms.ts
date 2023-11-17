import {
	CohereModelType,
	ModelVendor,
	OpenAIModelType,
	PromptConfigTest,
} from '@/types';

export enum SupportTopic {
	API = 'API',
	Billing = 'Billing',
	Other = 'Other',
	Request = 'Request',
	SDK = 'SDK',
	WebApp = 'Web-app',
}

export const DefaultOpenAIPromptConfigTest: PromptConfigTest<ModelVendor.OpenAI> =
	{
		modelParameters: {
			frequencyPenalty: 0,
			maxTokens: 256,
			presencePenalty: 0,
			temperature: 1,
			topP: 1,
		},
		modelType: OpenAIModelType.Gpt35Turbo,
		modelVendor: ModelVendor.OpenAI,
		name: '',
		promptMessages: [],
		templateVariables: {},
	};

export const DefaultCoherePromptConfigTest: PromptConfigTest<ModelVendor.Cohere> =
	{
		modelParameters: {
			temperature: 1,
		},
		modelType: CohereModelType.Command,
		modelVendor: ModelVendor.Cohere,
		name: '',
		promptMessages: [],
		templateVariables: {},
	};

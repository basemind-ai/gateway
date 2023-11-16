import {
	ModelVendor,
	OpenAIModelParameters,
	OpenAIModelType,
	OpenAIPromptMessage,
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

export const DefaultPromptConfigTest: PromptConfigTest<
	OpenAIModelParameters,
	OpenAIPromptMessage
> = {
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

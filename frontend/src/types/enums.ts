export enum ModelVendor {
	Cohere = 'COHERE',
	OpenAI = 'OPEN_AI',
}
export enum OpenAIModelType {
	Gpt3516K = 'gpt-3.5-turbo-16k',
	Gpt35Turbo = 'gpt-3.5-turbo',
	Gpt4 = 'gpt-4',
	Gpt432K = 'gpt-4-32k',
}

export enum CohereModelType {
	Command = 'command',
	CommandLight = 'command-light',
	CommandLightNightly = 'command-light-nightly',
	CommandNightly = 'command-nightly',
}

export enum AccessPermission {
	ADMIN = 'ADMIN',
	MEMBER = 'MEMBER',
}

export enum OpenAIPromptMessageRole {
	Assistant = 'assistant',
	System = 'system',
	Tool = 'tool',
	User = 'user',
}

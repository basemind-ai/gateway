// Provider Message Types

import { Record } from 'react-bootstrap-icons';

import { CohereModelType, OpenAIModelType } from '@/types/enums';

export type OpenAIPromptMessage =
	| ({
			templateVariables?: string[];
	  } & {
			content: string;
			name?: string;
			role: 'system' | 'user' | 'assistant';
	  })
	| {
			functionArguments: string[];
			name: string;
			role: 'function';
	  };

// Provider Model Parameters

export interface OpenAIModelParameters {
	frequencyPenalty?: number;
	maxTokens?: number;
	presencePenalty?: number;
	temperature?: number;
	topP?: number;
}

export interface CohereModelParameters {
	temperature?: number;
}

export interface ModelConfig<P extends Record<string, any>> {
	icon: string;
	name: string;
	parameters: {
		[K in keyof P]: {
			max: number;
			min: number;
			step: number;
		};
	};
}

export type OpenAIModelsRecord = Record<
	OpenAIModelType,
	ModelConfig<Required<OpenAIModelParameters>>
>;

export type CohereModelsRecord = Record<
	CohereModelType,
	ModelConfig<Required<CohereModelParameters>>
>;

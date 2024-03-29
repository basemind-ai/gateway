// Provider Message Types

import { Record } from 'react-bootstrap-icons';

import {
	CohereModelType,
	ModelVendor,
	OpenAIModelType,
	OpenAIPromptMessageRole,
} from '@/types/enums';

export type OpenAIContentMessageRole =
	| OpenAIPromptMessageRole.System
	| OpenAIPromptMessageRole.User
	| OpenAIPromptMessageRole.Assistant;

export interface OpenAIPromptMessage {
	content: string;
	name?: string;
	role: OpenAIContentMessageRole;
	templateVariables?: string[];
}

// Provider Model Parameters

export interface OpenAIModelParameters {
	frequencyPenalty?: number;
	maxTokens?: number;
	presencePenalty?: number;
	temperature?: number;
	topP?: number;
}

export interface CohereConnector {
	id: 'websearch' | 'id';
	options: Record<string, any>;
}

export interface CohereModelParameters {
	frequencyPenalty?: number;
	k?: number;
	maxTokens?: number;
	p?: number;
	presencePenalty?: number;
	temperature?: number;
}

export interface CoherePromptMessage {
	message: string;
	templateVariables?: string[];
}

// composite types

export type ModelType<T extends ModelVendor> = T extends ModelVendor.OpenAI
	? OpenAIModelType
	: CohereModelType;

export type ModelParameters<T extends ModelVendor> =
	T extends ModelVendor.OpenAI
		? OpenAIModelParameters
		: CohereModelParameters;

export type ProviderMessageType<T extends ModelVendor> =
	T extends ModelVendor.OpenAI ? OpenAIPromptMessage : CoherePromptMessage;

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

export type ModelRecord<T extends ModelVendor> = Record<
	ModelType<T>,
	ModelConfig<ModelParameters<T>>
>;

export type OpenAIModelsRecord = ModelRecord<ModelVendor.OpenAI>;
export type CohereModelsRecord = ModelRecord<ModelVendor.Cohere>;

import { Record } from 'react-bootstrap-icons';

import { SupportTopic } from '@/constants/forms';

export enum ModelVendor {
	Cohere = 'COHERE',
	OpenAI = 'OPEN_AI',
}
export enum unavailableModelVendors {
	A21Labs = 'A21_LABS',
	Anthropic = 'ANTHROPIC',
	Google = 'GOOGLE',
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

// Analytics

export interface AnalyticsDTO {
	tokensCost: number;
	totalRequests: number;
}

// Project

export interface Project {
	createdAt: string;
	description?: string;
	id: string;
	name: string;
	permission: AccessPermission;
	updatedAt: string;
}

export type ProjectCreateBody = Pick<Project, 'name' | 'description'>;
export type ProjectUpdateBody = Partial<ProjectCreateBody>;

// Application

export interface Application {
	createdAt: string;
	description?: string;
	id: string;
	name: string;
	updatedAt: string;
}

export type ApplicationCreateBody = Pick<Application, 'name' | 'description'>;
export type ApplicationUpdateBody = Partial<ApplicationCreateBody>;

// PromptConfig

export interface PromptConfig<
	P extends Record<string, any> = Record<string, any>,
	M extends Record<string, any> = Record<string, any>,
> {
	createdAt: string;
	expectedTemplateVariables: string[];
	id: string;
	isDefault: boolean;
	modelParameters: P;
	modelType: OpenAIModelType;
	modelVendor: ModelVendor;
	name: string;
	providerPromptMessages: M[];
	updatedAt: string;
}

export type PromptConfigCreateBody<
	P extends Record<string, any> = Record<string, any>,
	M extends Record<string, any> = Record<string, any>,
> = Pick<
	PromptConfig<P, M>,
	'name' | 'modelParameters' | 'modelType' | 'modelVendor'
> & { promptMessages: M[] };

export type PromptConfigUpdateBody = Partial<PromptConfigCreateBody>;

// APIKey

export interface APIKey {
	createdAt: string;
	hash?: string;
	id: string;
	name: string;
}

export type APIKeyCreateBody = Pick<APIKey, 'name'>;

// Provider Message Types

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

// UserAccount

export interface AddUserToProjectBody {
	email: string;
	permission: AccessPermission;
}

export interface UserProjectPermissionUpdateBody {
	permission: AccessPermission;
	userId: string;
}

export interface ProjectUserAccount {
	createdAt: string;
	displayName: string;
	email: string;
	firebaseId: string;
	id: string;
	permission: AccessPermission;
	phoneNumber: string;
	photoUrl: string;
}

// OTP

export interface OTP {
	otp: string;
}

// Prompt Testing

export interface PromptConfigTest<
	P extends Record<string, any> = Record<string, any>,
	M extends Record<string, any> = Record<string, any>,
> {
	modelParameters: P;
	modelType: OpenAIModelType | CohereModelType;
	modelVendor: ModelVendor;
	name: string;
	promptConfigId?: string;
	promptMessages: M[];
	templateVariables: Record<string, string>;
}

export interface PromptConfigTestResultChunk {
	content?: string;
	errorMessage?: string;
	finishReason?: string;
	promptConfigId?: string;
	promptTestRecordId?: string;
}

export interface SupportTicketCreateBody {
	body: string;
	projectId?: string;
	subject?: string;
	topic: SupportTopic;
}

// Provider Key

export interface ProviderKeyCreateBody {
	key: string;
	modelVendor: ModelVendor;
}

export interface ProviderKey {
	createdAt: string;
	id: string;
	modelVendor: ModelVendor;
}

// Prompt Test Record

export interface PromptTestRecord<P, M> {
	createdAt: string;
	errorLog?: string;
	finishTime: string;
	id: string;
	modelParameters: P;
	modelType: OpenAIModelType;
	modelVendor: ModelVendor;
	name: string;
	promptConfigId?: string;
	promptResponse: string;
	providerPromptMessages: M;
	requestTokens: number;
	responseTokens: number;
	startTime: string;
	streamResponseLatency: number;
	userInput: Record<string, string>;
}

export enum TestSection {
	ModelConfiguration = 'modelConfiguration',
	PromptTemplate = 'promptTemplate',
	Results = 'results',
	TestInputs = 'testInputs',
}

export enum OpenAIPromptMessageRole {
	Assistant = 'assistant',
	System = 'system',
	User = 'user',
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

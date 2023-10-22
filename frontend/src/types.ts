export enum ModelVendor {
	OpenAI = 'OPEN_AI',
}

export enum ModelType {
	Gpt35Turbo = 'gpt-3.5-turbo',
	Gpt3516K = 'gpt-3.5-turbo-16k',
	Gpt4 = 'gpt-4',
	Gpt432K = 'gpt-4-32k',
}

export enum AccessPermission {
	ADMIN = 'ADMIN',
	MEMBER = 'MEMBER',
}

// Project

export interface Project {
	id: string;
	name: string;
	description?: string;
	createdAt: string;
	updatedAt: string;
	permission: AccessPermission;
}

export interface ProjectAnalytics {
	totalAPICalls: number;
	modelsCost: number;
}

export type ProjectCreateBody = Pick<Project, 'name' | 'description'>;
export type ProjectUpdateBody = Partial<ProjectCreateBody>;

// Application

export interface Application {
	id: string;
	name: string;
	description?: string;
	createdAt: string;
	updatedAt: string;
}

export interface ApplicationAnalytics {
	totalRequests: number;
	projectedCost: number;
}

export type ApplicationCreateBody = Pick<Application, 'name' | 'description'>;
export type ApplicationUpdateBody = Partial<ApplicationCreateBody>;

// PromptConfig

export interface PromptConfig<P = any, M = any> {
	id: string;
	name: string;
	modelParameters: P;
	modelType: ModelType;
	modelVendor: ModelVendor;
	providerPromptMessages: M[];
	expectedTemplateVariables: string[];
	isDefault: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface PromptConfigAnalytics {
	totalPromptRequests: number;
	modelsCost: number;
}

export type PromptConfigCreateBody<P = any, M = any> = Pick<
	PromptConfig<P, M>,
	| 'name'
	| 'modelParameters'
	| 'modelType'
	| 'modelVendor'
	| 'providerPromptMessages'
>;

export type PromptConfigUpdateBody = Partial<PromptConfigCreateBody>;

// Token

export interface Token {
	id: string;
	hash?: string;
	name: string;
	createdAt: string;
}

export type TokenCreateBody = Pick<Token, 'name'>;

// Provider Message Types

export type OpenAIPromptMessage = {
	templateVariables: string[];
} & (
	| {
			content: string;
			name?: string;
			role: 'system' | 'user' | 'assistant';
	  }
	| {
			functionArguments: string[];
			name: string;
			role: 'function';
	  }
);

// Provider Model Parameters

export interface OpenAIModelParameters {
	temperature?: number;
	maxTokens?: number;
	topP?: number;
	frequencyPenalty?: number;
	presencePenalty?: number;
}

// UserAccount

export type AddUserToProjectBody = {
	permission: AccessPermission;
} & ({ userId: string } | { email: string });

export interface UserProjectPermissionUpdateBody {
	userId: string;
	permission: AccessPermission;
}

export interface ProjectUserAccount {
	id: string;
	displayName: string;
	email: string;
	firebaseId: string;
	phoneNumber: string;
	photoUrl: string;
	createdAt: string;
	permission: AccessPermission;
}

// OTP

export interface OTP {
	otp: string;
}

// Prompt Testing

export interface PromptConfigTest<P, M> {
	name: string;
	modelParameters: P;
	modelType: ModelType;
	modelVendor: ModelVendor;
	promptMessages: M[];
	templateVariables: Record<string, string>;
	promptConfigId?: string;
}

export interface PromptConfigTestResultChunk {
	content?: string;
	errorMessage?: string;
	finishReason?: string;
	promptConfigId?: string;
	promptTestRecordId?: string;
}

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
	isUserDefaultProject: boolean;
	permission: AccessPermission;
	applications: Application[];
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

export type ApplicationCreateBody = Pick<Application, 'name' | 'description'>;
export type ApplicationUpdateBody = Partial<ApplicationCreateBody>;

// PromptConfig

export interface PromptConfig<
	P extends Record<string, string | number> = Record<string, string | number>,
	M extends Record<string, string | number> = Record<string, string | number>,
> {
	id: string;
	name: string;
	modelParameters: P;
	modelType: ModelType;
	modelVendor: ModelVendor;
	providerPromptMessages: M;
	expectedTemplateVariables: string[];
	isDefault: boolean;
	createdAt: string;
	updatedAt: string;
}

export type PromptConfigCreateBody<
	P extends Record<string, string | number> = Record<string, string | number>,
	M extends Record<string, string | number> = Record<string, string | number>,
> = Pick<
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

// UserAccount

export interface UserAccount {
	id: string;
	firebaseId: string;
	projects: Project[];
}

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

// Analytics
import { SupportTopic } from '@/constants/forms';
import { AccessPermission, ModelVendor } from '@/types/enums';
import {
	ModelParameters,
	ModelType,
	ProviderMessageType,
} from '@/types/models';

export interface Analytics {
	tokensCost: number;
	totalRequests: number;
}

// Project

export interface Project {
	createdAt: string;
	credits: string;
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

export interface PromptConfig<T extends ModelVendor> {
	createdAt: string;
	expectedTemplateVariables: string[];
	id: string;
	isDefault?: boolean;
	modelParameters: ModelParameters<T>;
	modelType: ModelType<T>;
	modelVendor: T;
	name: string;
	providerPromptMessages: ProviderMessageType<T>[];
	updatedAt: string;
}

export type PromptConfigCreateBody<T extends ModelVendor> = Pick<
	PromptConfig<T>,
	'name' | 'modelParameters' | 'modelType' | 'modelVendor'
> & { promptMessages: ProviderMessageType<T>[] };

export type PromptConfigUpdateBody<T extends ModelVendor> = Partial<
	PromptConfigCreateBody<T>
>;

// APIKey

export interface APIKey {
	createdAt: string;
	hash?: string;
	id: string;
	name: string;
}

export type APIKeyCreateBody = Pick<APIKey, 'name'>;

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

export interface PromptConfigTest<T extends ModelVendor> {
	modelParameters: ModelParameters<T>;
	modelType: ModelType<T>;
	modelVendor: ModelVendor;
	promptConfigId?: string;
	promptMessages: ProviderMessageType<T>[];
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

export interface PromptTestRecord<T extends ModelVendor> {
	createdAt: string;
	durationMs: number;
	errorLog?: string;
	finishTime: string;
	id: string;
	modelParameters: ModelParameters<T>;
	modelType: ModelType<T>;
	modelVendor: T;
	promptConfigId?: string;
	promptResponse: string;
	providerPromptMessages: ProviderMessageType<T>;
	requestTokens: number;
	requestTokensCost: string;
	responseTokens: number;
	responseTokensCost: string;
	startTime: string;
	totalTokensCost: string;
	userInput: Record<string, string>;
}

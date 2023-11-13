import { faker } from '@faker-js/faker';
import { UserInfo } from '@firebase/auth';
import { TypeFactory } from 'interface-forge';

import {
	AccessPermission,
	APIKey,
	Application,
	ModelType,
	ModelVendor,
	OpenAIPromptMessage,
	Project,
	ProjectUserAccount,
	PromptConfig,
	PromptTestRecord,
	ProviderKey,
} from '@/types';

export const UserFactory = new TypeFactory<UserInfo>(() => ({
	displayName: faker.person.fullName(),
	email: faker.internet.email(),
	phoneNumber: faker.phone.number(),
	photoURL: faker.internet.url(),
	providerId: faker.string.uuid(),
	uid: faker.string.uuid(),
}));

export const ProjectFactory = new TypeFactory<Project>(() => ({
	id: faker.string.uuid(),
	name: faker.lorem.words(),
	description: faker.lorem.paragraph(),
	permission: AccessPermission.ADMIN,
	createdAt: faker.date.past().toISOString(),
	updatedAt: faker.date.past().toISOString(),
	applications: undefined,
}));

export const ApplicationFactory = new TypeFactory<Application>(() => ({
	id: faker.string.uuid(),
	name: faker.lorem.words(),
	description: faker.lorem.paragraph(),
	createdAt: faker.date.past().toISOString(),
	updatedAt: faker.date.past().toISOString(),
}));
export const OpenAIPromptMessageFactory = new TypeFactory<OpenAIPromptMessage>(
	() => ({
		templateVariables: [],
		content: faker.lorem.sentence(),
		name: undefined,
		role: TypeFactory.sample(['user', 'system', 'assistant']),
	}),
);

export const PromptConfigFactory = new TypeFactory<PromptConfig>(() => ({
	id: faker.string.uuid(),
	name: faker.lorem.words(),
	modelParameters: {},
	modelVendor: ModelVendor.OpenAI,
	modelType: TypeFactory.sample(Object.values(ModelVendor)),
	providerPromptMessages: OpenAIPromptMessageFactory.batchSync(3),
	expectedTemplateVariables: [],
	isDefault: false,
	createdAt: faker.date.past().toISOString(),
	updatedAt: faker.date.past().toISOString(),
}));

export const APIKeyFactory = new TypeFactory<APIKey>(() => ({
	id: faker.string.uuid(),
	hash: faker.string.uuid(),
	name: faker.lorem.words(),
	createdAt: faker.date.past().toISOString(),
	isDefault: faker.datatype.boolean(),
}));

export const ProjectUserAccountFactory = new TypeFactory<ProjectUserAccount>(
	() => ({
		id: faker.string.uuid(),
		displayName: faker.person.fullName(),
		email: faker.internet.email(),
		firebaseId: faker.string.uuid(),
		phoneNumber: faker.phone.number(),
		photoUrl: faker.internet.url(),
		createdAt: faker.date.past().toISOString(),
		permission: AccessPermission.ADMIN,
	}),
);

export const ProviderKeyFactory = new TypeFactory<ProviderKey>(() => ({
	id: faker.string.uuid(),
	modelVendor: ModelVendor.OpenAI,
	createdAt: faker.date.past().toISOString(),
}));

export const PromptTestRecordFactory = new TypeFactory<
	PromptTestRecord<any, any>
>(() => ({
	id: faker.string.uuid(),
	createdAt: faker.date.past().toISOString(),
	errorLog: undefined,
	finishTime: faker.date.past().toISOString(),
	modelParameters: {},
	modelType: ModelType.Gpt432K,
	modelVendor: ModelVendor.OpenAI,
	name: faker.lorem.words(),
	promptConfigId: undefined,
	promptResponse: 'you are a bot like me',
	providerPromptMessages: {},
	requestTokens: 10,
	responseTokens: 10,
	startTime: faker.date.past().toISOString(),
	streamResponseLatency: 100,
	userInput: { userInput: 'what am I?' },
}));

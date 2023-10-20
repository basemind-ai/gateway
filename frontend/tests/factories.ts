import { faker } from '@faker-js/faker';
import { UserInfo } from '@firebase/auth';
import { TypeFactory } from 'interface-forge';

import {
	AccessPermission,
	Application,
	ModelVendor,
	OpenAIPromptMessage,
	Project,
	ProjectUserAccount,
	PromptConfig,
	Token,
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
	providerPromptMessages: OpenAIPromptMessageFactory.batch(3),
	expectedTemplateVariables: [],
	isDefault: false,
	createdAt: faker.date.past().toISOString(),
	updatedAt: faker.date.past().toISOString(),
}));

export const TokenFactory = new TypeFactory<Token>(() => ({
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

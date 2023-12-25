import { faker } from '@faker-js/faker';
import { UserInfo } from '@firebase/auth';
import { TypeFactory } from 'interface-forge';

import {
	AccessPermission,
	APIKey,
	Application,
	CoherePromptMessage,
	ModelVendor,
	OpenAIModelType,
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
	applications: undefined,
	createdAt: faker.date.past().toISOString(),
	credits: '1.0',
	description: faker.lorem.paragraph(),
	id: faker.string.uuid(),
	name: faker.lorem.words(),
	permission: AccessPermission.ADMIN,
	updatedAt: faker.date.past().toISOString(),
}));

export const ApplicationFactory = new TypeFactory<Application>(() => ({
	createdAt: faker.date.past().toISOString(),
	description: faker.lorem.paragraph(),
	id: faker.string.uuid(),
	name: faker.lorem.words(),
	updatedAt: faker.date.past().toISOString(),
}));
export const OpenAIPromptMessageFactory = new TypeFactory<OpenAIPromptMessage>(
	(i) =>
		i % 4 === 0
			? {
					functionArguments: ['a', 'b'],
					name: 'myFunction',
					role: 'function',
				}
			: {
					content: faker.lorem.sentence(),
					name: undefined,
					role: TypeFactory.sample(['user', 'system', 'assistant']),
					templateVariables: [],
				},
);

export const OpenAIPromptConfigFactory = new TypeFactory<
	PromptConfig<ModelVendor.OpenAI>
>(() => ({
	createdAt: faker.date.past().toISOString(),
	expectedTemplateVariables: [],
	id: faker.string.uuid(),
	isDefault: false,
	modelParameters: {},
	modelType: TypeFactory.sample(Object.values(OpenAIModelType)),
	modelVendor: ModelVendor.OpenAI,
	name: faker.lorem.word({ length: 5 }),
	providerPromptMessages: OpenAIPromptMessageFactory.batchSync(3),
	updatedAt: faker.date.past().toISOString(),
}));

export const CohereMessageFactory = new TypeFactory<CoherePromptMessage>(
	() => ({
		message: faker.lorem.sentence(),
		templateVariables: [],
	}),
);

export const APIKeyFactory = new TypeFactory<APIKey>(() => ({
	createdAt: faker.date.past().toISOString(),
	hash: faker.string.uuid(),
	id: faker.string.uuid(),
	isDefault: faker.datatype.boolean(),
	name: faker.lorem.words(),
}));

export const ProjectUserAccountFactory = new TypeFactory<ProjectUserAccount>(
	() => ({
		createdAt: faker.date.past().toISOString(),
		displayName: faker.person.fullName(),
		email: faker.internet.email(),
		firebaseId: faker.string.uuid(),
		id: faker.string.uuid(),
		permission: AccessPermission.ADMIN,
		phoneNumber: faker.phone.number(),
		photoUrl: faker.internet.url(),
	}),
);

export const ProviderKeyFactory = new TypeFactory<ProviderKey>(() => ({
	createdAt: faker.date.past().toISOString(),
	id: faker.string.uuid(),
	modelVendor: ModelVendor.OpenAI,
}));

export const PromptTestRecordFactory = new TypeFactory<PromptTestRecord<any>>(
	() => ({
		createdAt: faker.date.past().toISOString(),
		durationMs: 100,
		errorLog: undefined,
		finishTime: faker.date.past().toISOString(),
		id: faker.string.uuid(),
		modelParameters: {},
		modelType: OpenAIModelType.Gpt432K,
		modelVendor: ModelVendor.OpenAI,
		promptConfigId: undefined,
		promptResponse: 'you are a bot like me',
		providerPromptMessages: {},
		requestTokens: 10,
		requestTokensCost: '0.00001',
		responseTokens: 10,
		responseTokensCost: '0.00001',
		startTime: faker.date.past().toISOString(),
		totalTokensCost: '0.00002',
		userInput: { userInput: 'what am I?' },
	}),
);

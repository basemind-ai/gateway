import { faker } from '@faker-js/faker';
import { UserInfo } from '@firebase/auth';
import { TypeFactory } from 'interface-forge';

import { AccessPermission, Project } from '@/types';

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
	applications: [],
}));

import { faker } from '@faker-js/faker';
import { UserInfo } from '@firebase/auth';
import { TypeFactory } from 'interface-forge';

export const UserFactory = new TypeFactory<UserInfo>(() => ({
	displayName: faker.person.fullName(),
	email: faker.internet.email(),
	phoneNumber: faker.phone.number(),
	photoURL: faker.internet.url(),
	providerId: faker.string.uuid(),
	uid: faker.string.uuid(),
}));

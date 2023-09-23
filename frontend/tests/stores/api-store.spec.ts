import { UserFactory } from 'tests/factories';
import { beforeEach } from 'vitest';

import { userStoreStateCreator } from '@/stores/user-store';

describe('userStoreStateCreator tests', () => {
	const set = vi.fn();
	const get = vi.fn();

	beforeEach(() => {
		vi.resetAllMocks();
	});

	it('sets user', async () => {
		const store = userStoreStateCreator(set, get, {} as any);
		const user = await UserFactory.build();
		store.setUser(user);
		expect(set).toHaveBeenCalledWith({ user });
	});
});

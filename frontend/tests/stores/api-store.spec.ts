import { UserFactory } from 'tests/factories';
import { renderHook } from 'tests/test-utils';
import { beforeEach, expect } from 'vitest';

import { apiStoreStateCreator, useSetUser, useUser } from '@/stores/api-store';

describe('api-store tests', () => {
	describe('apiStoreStateCreator', () => {
		const set = vi.fn();
		const get = vi.fn();

		beforeEach(() => {
			vi.resetAllMocks();
		});

		it('sets user', async () => {
			const store = apiStoreStateCreator(set, get, {} as any);
			const user = await UserFactory.build();
			store.setUser(user);
			expect(set).toHaveBeenCalledWith({ user });
		});
	});

	describe('setUser and useUser', () => {
		it('sets and returns user', async () => {
			const {
				result: { current: setUser },
			} = renderHook(useSetUser);

			const user = await UserFactory.build();
			setUser(user);

			const {
				result: { current: storedUser },
			} = renderHook(useUser);

			expect(storedUser).toEqual(user);
		});
	});
});

/* eslint-disable unicorn/no-abusive-eslint-disable,eslint-comments/no-unlimited-disable */
import { UserFactory } from 'tests/factories';
import { routerReplaceMock } from 'tests/mocks';
import { act, renderHook } from 'tests/test-utils';
import { beforeEach, expect } from 'vitest';

import { Navigation } from '@/constants';
import { useAuthenticatedUser } from '@/hooks/use-authenticated-user';
import * as apiStore from '@/stores/api-store';
import * as firebaseUtils from '@/utils/firebase';

describe('useAuthenticatedUser', () => {
	const setUserMock = vi.fn();
	const useUserSpy = vi.spyOn(apiStore, 'useUser').mockReturnValue(null);
	vi.spyOn(apiStore, 'useSetUser').mockReturnValue(setUserMock);

	const getFireBaseAuthSpy = vi
		.spyOn(firebaseUtils, 'getFirebaseAuth')
		.mockResolvedValue({ currentUser: null } as any);

	beforeEach(() => {
		setUserMock.mockReset();
	});

	it('should call setUser when the user is already authenticated but is not set in store', async () => {
		const user = UserFactory.buildSync();

		getFireBaseAuthSpy.mockResolvedValueOnce({
			currentUser: user,
		} as any);

		// eslint-disable-next-line
		await act(() => {
			renderHook(useAuthenticatedUser);
		});

		expect(setUserMock).toHaveBeenCalledWith(user);
		expect(routerReplaceMock).not.toHaveBeenCalled();
	});

	it('should route to sign-in when there is no authenticated user', async () => {
		// eslint-disable-next-line
		await act(() => {
			renderHook(useAuthenticatedUser);
		});

		expect(setUserMock).not.toHaveBeenCalled();
		expect(routerReplaceMock).toHaveBeenCalledWith(Navigation.SignIn);
	});

	it("should return the user if it's already set in the store", async () => {
		const user = UserFactory.buildSync();

		useUserSpy.mockReturnValue(user);

		const { result } = renderHook(useAuthenticatedUser);

		expect(result.current).toEqual(user);
		expect(setUserMock).not.toHaveBeenCalled();
		expect(routerReplaceMock).not.toHaveBeenCalled();
	});
});

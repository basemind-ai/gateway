import { UserInfo } from '@firebase/auth';
import { create, GetState, SetState } from 'zustand';
import { StateCreator } from 'zustand/vanilla';

export interface UserStore {
	user: UserInfo | null;
	setUser: (user: UserInfo) => void;
}

export const userStoreStateCreator: StateCreator<UserStore> = (
	set: SetState<UserStore>,
	_: GetState<UserStore>,
) => ({
	// user
	user: null,
	setUser: (user: UserInfo) => {
		set({ user });
	},
});

export const useUserStore = create(userStoreStateCreator);

export const useSetUser = () => useUserStore((s) => s.setUser);
export const useUser = () => useUserStore((s) => s.user);

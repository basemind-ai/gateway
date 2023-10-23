import { UserInfo } from '@firebase/auth';
import { create } from 'zustand';
import { StateCreator } from 'zustand/vanilla';

export interface ApiStore {
	user: UserInfo | null;
	setUser: (user: UserInfo | null) => void;
}

export const apiStoreStateCreator: StateCreator<ApiStore> = (set, _) => ({
	user: null,
	setUser: (user: UserInfo | null) => {
		set({ user });
	},
});

export const useAPIStore = create(apiStoreStateCreator);
export const useUser = () => useAPIStore((s) => s.user);
export const useSetUser = () => useAPIStore((s) => s.setUser);

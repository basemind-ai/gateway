import { persistNSync } from 'persist-and-sync';
import { create } from 'zustand';
import { StateCreator } from 'zustand/vanilla';

import { DateFormat } from '@/constants';

export interface UserConfigStore {
	dateFormat: DateFormat;
	resetState: () => void;
	setDateFormat: (dateFormat: DateFormat) => void;
}

const initialState = {
	dateFormat: DateFormat.ISO,
};

export const userConfigStoreStateCreator: StateCreator<UserConfigStore> = (
	set,
) => ({
	...initialState,
	resetState: () => {
		set(structuredClone(initialState));
	},
	setDateFormat: (dateFormat: DateFormat) => {
		set({ dateFormat });
	},
});

export const useUserConfigStore = create(
	persistNSync(userConfigStoreStateCreator, { name: 'user-config-store' }),
);
export const useResetState = () => useUserConfigStore((s) => s.resetState);
export const useDateFormat = () => useUserConfigStore((s) => s.dateFormat);
export const useSetDateFormat = () =>
	useUserConfigStore((s) => s.setDateFormat);

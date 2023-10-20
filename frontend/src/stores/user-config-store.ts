import { create } from 'zustand';
import { StateCreator } from 'zustand/vanilla';

import { DateFormat } from '@/constants';

export interface UserConfigStore {
	dateFormat: DateFormat;
	setDateFormat: (dateFormat: DateFormat) => void;
}

export const userConfigStoreStateCreator: StateCreator<UserConfigStore> = (
	set,
	_,
) => ({
	dateFormat: DateFormat.ISO,
	setDateFormat: (dateFormat: DateFormat) => {
		set({ dateFormat });
	},
});

export const useUserConfigStore = create(userConfigStoreStateCreator);
export const useDateFormat = () => useUserConfigStore((s) => s.dateFormat);
export const useSetDateFormat = () =>
	useUserConfigStore((s) => s.setDateFormat);

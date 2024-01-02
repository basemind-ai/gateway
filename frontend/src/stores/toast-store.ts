import { create } from 'zustand';
import { StateCreator } from 'zustand/vanilla';

export enum ToastType {
	ERROR = 'error',
	INFO = 'info',
	SUCCESS = 'success',
	WARNING = 'warning',
}

const DEFAULT_TIMEOUT = 4000;

export interface ToastMessage {
	message: string;
	type: ToastType;
}

export interface ToastStore {
	addErrorToast: (message: string) => void;
	addInfoToast: (message: string) => void;
	addSuccessToast: (message: string) => void;
	addToast: (toast: ToastMessage) => void;
	addWarningToast: (message: string) => void;
	popToast: () => void;
	resetState: () => void;
	timeout: number;
	toasts: ToastMessage[];
}

const initialState = {
	timeout: DEFAULT_TIMEOUT,
	toasts: [],
};

export const useToastStoreStateCreator: StateCreator<ToastStore> = (
	set,
	get,
) => ({
	...initialState,
	addErrorToast: (message: string) => {
		get().addToast({
			message,
			type: ToastType.ERROR,
		});
	},
	addInfoToast: (message: string) => {
		get().addToast({
			message,
			type: ToastType.INFO,
		});
	},
	addSuccessToast: (message: string) => {
		get().addToast({
			message,
			type: ToastType.SUCCESS,
		});
	},
	addToast: (toast: ToastMessage) => {
		set((state) => ({
			toasts: [...state.toasts, toast],
		}));
		setTimeout(() => {
			get().popToast();
		}, get().timeout);
	},
	addWarningToast: (message: string) => {
		get().addToast({
			message,
			type: ToastType.WARNING,
		});
	},
	popToast: () => {
		set((state) => ({
			toasts: state.toasts.slice(1),
		}));
	},
	resetState: () => {
		set(structuredClone(initialState));
	},
});

export const useToastStore = create(useToastStoreStateCreator);
export const useResetState = () => useToastStore((s) => s.resetState);
export const useShowError = () => useToastStore((s) => s.addErrorToast);
export const useShowInfo = () => useToastStore((s) => s.addInfoToast);
export const useShowSuccess = () => useToastStore((s) => s.addSuccessToast);
export const useShowWarning = () => useToastStore((s) => s.addWarningToast);
export const useToasts = () => useToastStore((s) => s.toasts);

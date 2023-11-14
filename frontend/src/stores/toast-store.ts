import { create } from 'zustand';
import { StateCreator } from 'zustand/vanilla';

export enum ToastType {
	ERROR = 'alert-error',
	INFO = 'alert-info',
	SUCCESS = 'alert-success',
	WARNING = 'alert-warning',
}

const DEFAULT_TIMEOUT = 4000;

interface ToastMessage {
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
	timeout: number;
	toasts: ToastMessage[];
}

export const useToastStoreStateCreator: StateCreator<ToastStore> = (
	set,
	get,
) => ({
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
	timeout: DEFAULT_TIMEOUT,
	toasts: [],
});

export const useToastStore = create(useToastStoreStateCreator);
export const useToasts = () => useToastStore((s) => s.toasts);
export const useShowError = () => useToastStore((s) => s.addErrorToast);
export const useShowSuccess = () => useToastStore((s) => s.addSuccessToast);
export const useShowInfo = () => useToastStore((s) => s.addInfoToast);
export const useShowWarning = () => useToastStore((s) => s.addWarningToast);

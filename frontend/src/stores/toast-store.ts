import { create } from 'zustand';
import { StateCreator } from 'zustand/vanilla';

export enum ToastType {
	INFO = 'alert-info',
	SUCCESS = 'alert-success',
	ERROR = 'alert-error',
	WARNING = 'alert-warning',
}

const DEFAULT_TIMEOUT = 4000;

interface ToastMessage {
	message: string;
	type: ToastType;
}

export interface ToastStore {
	toasts: ToastMessage[];
	addToast: (toast: ToastMessage) => void;
	addErrorToast: (message: string) => void;
	addSuccessToast: (message: string) => void;
	addInfoToast: (message: string) => void;
	addWarningToast: (message: string) => void;
	popToast: () => void;
	timeout: number;
}

export const useToastStoreStateCreator: StateCreator<ToastStore> = (
	set,
	get,
) => ({
	toasts: [],
	addToast: (toast: ToastMessage) => {
		set((state) => ({
			toasts: [...state.toasts, toast],
		}));
		setTimeout(() => {
			get().popToast();
		}, get().timeout);
	},
	addErrorToast: (message: string) => {
		get().addToast({
			message,
			type: ToastType.ERROR,
		});
	},
	addSuccessToast: (message: string) => {
		get().addToast({
			message,
			type: ToastType.SUCCESS,
		});
	},
	addInfoToast: (message: string) => {
		get().addToast({
			message,
			type: ToastType.INFO,
		});
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
});

export const useToastStore = create(useToastStoreStateCreator);
export const useToasts = () => useToastStore((s) => s.toasts);
export const useShowError = () => useToastStore((s) => s.addErrorToast);
export const useShowSuccess = () => useToastStore((s) => s.addSuccessToast);
export const useShowInfo = () => useToastStore((s) => s.addInfoToast);
export const useShowWarning = () => useToastStore((s) => s.addWarningToast);

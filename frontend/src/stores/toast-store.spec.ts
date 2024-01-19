import { renderHook } from 'tests/test-utils';

import {
	ToastType,
	useResetState,
	useShowError,
	useShowInfo,
	useShowSuccess,
	useShowWarning,
	useToasts,
} from '@/stores/toast-store';

describe('toast-store tests', () => {
	const {
		result: { current: resetState },
	} = renderHook(useResetState);

	beforeEach(() => {
		resetState();
	});

	vi.useFakeTimers();

	beforeEach(() => {
		vi.runAllTimers();
	});

	it('adds toast and pops it after a timeout', () => {
		const {
			result: { current: showError },
		} = renderHook(useShowError);
		const message = 'err message';
		showError(message);

		const {
			result: { current: toasts },
		} = renderHook(useToasts);
		expect(toasts).toStrictEqual([{ message, type: ToastType.ERROR }]);

		vi.runAllTimers();

		const {
			result: { current: toastsNow },
		} = renderHook(useToasts);
		expect(toastsNow).toStrictEqual([]);
	});

	it('adds multiple toasts and pops them after a timeout', () => {
		const {
			result: { current: showError },
		} = renderHook(useShowError);
		const {
			result: { current: showSuccess },
		} = renderHook(useShowSuccess);
		const message = 'message';
		showError(message);
		showSuccess(message);

		const {
			result: { current: toasts },
		} = renderHook(useToasts);
		expect(toasts.length).toBe(2);

		vi.runAllTimers();

		const {
			result: { current: toastsNow },
		} = renderHook(useToasts);
		expect(toastsNow).toStrictEqual([]);
	});

	it('adds error variation of toast', () => {
		const {
			result: { current: showError },
		} = renderHook(useShowError);
		const message = 'message';
		showError(message);

		const {
			result: { current: toasts },
		} = renderHook(useToasts);
		expect(toasts[0].type).toBe(ToastType.ERROR);
	});

	it('adds success variation of toast', () => {
		const {
			result: { current: showSuccess },
		} = renderHook(useShowSuccess);
		const message = 'message';
		showSuccess(message);

		const {
			result: { current: toasts },
		} = renderHook(useToasts);
		expect(toasts[0].type).toBe(ToastType.SUCCESS);
	});

	it('adds info variation of toast', () => {
		const {
			result: { current: showInfo },
		} = renderHook(useShowInfo);
		const message = 'message';
		showInfo(message);

		const {
			result: { current: toasts },
		} = renderHook(useToasts);
		expect(toasts[0].type).toBe(ToastType.INFO);
	});

	it('adds warning variation of toast', () => {
		const {
			result: { current: showWarning },
		} = renderHook(useShowWarning);
		const message = 'message';
		showWarning(message);

		const {
			result: { current: toasts },
		} = renderHook(useToasts);
		expect(toasts[0].type).toBe(ToastType.WARNING);
	});
});

import { render, renderHook, screen } from 'tests/test-utils';

import { ToastProvider } from '@/components/toast-provider';
import { useShowInfo } from '@/stores/toast-store';

describe('ToastProvider', () => {
	vi.useFakeTimers();
	it('renders toast container', () => {
		render(
			<ToastProvider>
				<h1>Screen</h1>
			</ToastProvider>,
		);

		const toastContainer = screen.getByTestId('toast-container');
		expect(toastContainer).toBeInTheDocument();
	});

	it('renders a toast and pops it', () => {
		const { rerender } = render(
			<ToastProvider>
				<h1>Screen</h1>
			</ToastProvider>,
		);

		const {
			result: { current: showInfo },
		} = renderHook(useShowInfo);
		showInfo('Test message');
		rerender(
			<ToastProvider>
				<h1>Screen</h1>
			</ToastProvider>,
		);

		const toastMessage = screen.getByTestId('toast-message');
		expect(toastMessage).toBeInTheDocument();

		vi.runAllTimers();
		rerender(
			<ToastProvider>
				<h1>Screen</h1>
			</ToastProvider>,
		);

		const toastMessageQuery = screen.queryByTestId('toast-message');
		expect(toastMessageQuery).not.toBeInTheDocument();
	});

	it('renders multiple timers and pops them', () => {
		const { rerender } = render(
			<ToastProvider>
				<h1>Screen</h1>
			</ToastProvider>,
		);

		const {
			result: { current: showInfo },
		} = renderHook(useShowInfo);
		showInfo('Test message');
		showInfo('Test message2');
		rerender(
			<ToastProvider>
				<h1>Screen</h1>
			</ToastProvider>,
		);

		const toastMessages = screen.getAllByTestId('toast-message');
		expect(toastMessages.length).toBe(2);

		vi.runAllTimers();
		rerender(
			<ToastProvider>
				<h1>Screen</h1>
			</ToastProvider>,
		);

		const toastMessagesQuery = screen.queryAllByTestId('toast-message');
		expect(toastMessagesQuery.length).toBe(0);
	});
});

import { render, renderHook, screen } from 'tests/test-utils';

import { useShowInfo } from '@/stores/toast-store';

describe('ToastProvider', () => {
	vi.useFakeTimers();
	it('renders toast container', () => {
		render(<h1>Screen</h1>);

		const toastContainer = screen.getByTestId('toast-container');
		expect(toastContainer).toBeInTheDocument();
	});

	it('renders a toast and pops it', () => {
		const { rerender } = render(<h1>Screen</h1>);

		const {
			result: { current: showInfo },
		} = renderHook(useShowInfo);
		showInfo('Test message');
		rerender(<h1>Screen</h1>);

		const toastMessage = screen.getByTestId('toast-message-info');
		expect(toastMessage).toBeInTheDocument();

		vi.runAllTimers();
		rerender(<h1>Screen</h1>);

		const toastMessageQuery = screen.queryByTestId('toast-message-info');
		expect(toastMessageQuery).not.toBeInTheDocument();
	});

	it('renders multiple timers and pops them', () => {
		const { rerender } = render(<h1>Screen</h1>);

		const {
			result: { current: showInfo },
		} = renderHook(useShowInfo);
		showInfo('Test message');
		showInfo('Test message2');
		rerender(<h1>Screen</h1>);

		const toastMessages = screen.getAllByTestId('toast-message-info');
		expect(toastMessages.length).toBe(2);

		vi.runAllTimers();
		rerender(<h1>Screen</h1>);

		const toastMessagesQuery =
			screen.queryAllByTestId('toast-message-info');
		expect(toastMessagesQuery.length).toBe(0);
	});
});

import { act } from 'react-dom/test-utils';
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
		const {
			result: { current: showInfo },
		} = renderHook(useShowInfo);

		const { rerender } = render(<h1>Screen</h1>);

		act(() => {
			showInfo('Test message');
		});
		rerender(<h1>Screen</h1>);

		const toastMessage = screen.getByTestId('toast-message');
		expect(toastMessage).toBeInTheDocument();

		vi.runAllTimers();
		rerender(<h1>Screen</h1>);

		const toastMessageQuery = screen.queryByTestId('toast-message');
		expect(toastMessageQuery).not.toBeInTheDocument();
	});

	it('renders multiple timers and pops them', () => {
		const {
			result: { current: showInfo },
		} = renderHook(useShowInfo);

		const { rerender } = render(<h1>Screen</h1>);

		act(() => {
			showInfo('Test message');
			showInfo('Test message2');
		});

		rerender(<h1>Screen</h1>);

		const toastMessages = screen.getAllByTestId('toast-message');
		expect(toastMessages.length).toBe(2);

		vi.runAllTimers();
		rerender(<h1>Screen</h1>);

		const toastMessagesQuery = screen.queryAllByTestId('toast-message');
		expect(toastMessagesQuery.length).toBe(0);
	});
});

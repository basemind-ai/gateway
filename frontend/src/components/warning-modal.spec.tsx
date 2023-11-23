import { fireEvent, render, screen } from 'tests/test-utils';

import { WarningModal } from '@/components/warning-modal';

describe('WarningModal tests', () => {
	it('renders the warning message', () => {
		render(
			<WarningModal
				warningText="This is a warning message"
				closeModal={vi.fn()}
				onContinue={vi.fn()}
			/>,
		);
		expect(
			screen.getByText('This is a warning message'),
		).toBeInTheDocument();
	});

	it('closes on cancel', () => {
		const closeModalMock = vi.fn();
		render(
			<WarningModal
				warningText="This is a warning message"
				closeModal={closeModalMock}
				onContinue={vi.fn()}
			/>,
		);
		fireEvent.click(screen.getByTestId('warning-modal-cancel-button'));
		expect(closeModalMock).toHaveBeenCalled();
	});

	it('calls on continue', () => {
		const onContinueMock = vi.fn();
		render(
			<WarningModal
				warningText="This is a warning message"
				closeModal={vi.fn()}
				onContinue={onContinueMock}
			/>,
		);
		fireEvent.click(screen.getByTestId('warning-modal-continue-button'));
		expect(onContinueMock).toHaveBeenCalled();
	});
});

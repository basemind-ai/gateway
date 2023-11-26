import { render, screen, waitFor } from 'tests/test-utils';
import { expect } from 'vitest';

import { Modal } from '@/components/modal';

describe('Modal', () => {
	it('should render the modal with the provided children when modalOpen is true', () => {
		const modalOpen = true;
		const onOpen = vi.fn();
		const onClose = vi.fn();

		render(
			<Modal modalOpen={modalOpen} onOpen={onOpen} onClose={onClose}>
				<div>Modal Content</div>
			</Modal>,
		);

		expect(screen.getByTestId('dialog-modal')).toBeInTheDocument();
		expect(screen.getByTestId('modal-content')).toBeInTheDocument();
		expect(screen.getByText('Modal Content')).toBeInTheDocument();
	});

	it('should open the modal when modalOpen is true', async () => {
		const onOpen = vi.fn();
		const onClose = vi.fn();

		render(
			<Modal modalOpen={true} onOpen={onOpen} onClose={onClose}>
				<div>Modal Content</div>
			</Modal>,
		);
		await waitFor(() => {
			expect(screen.getByTestId('dialog-modal')).toBeInTheDocument();
		});

		expect(screen.getByTestId('modal-content')).toBeInTheDocument();
		await waitFor(() => {
			expect(onOpen).toHaveBeenCalled();
		});
		expect(onClose).not.toHaveBeenCalled();
	});

	it('should close the modal when modalOpen is false', async () => {
		const onOpen = vi.fn();
		const onClose = vi.fn();

		const { rerender } = render(
			<Modal modalOpen={true} onOpen={onOpen} onClose={onClose}>
				<div>Modal Content</div>
			</Modal>,
		);

		expect(screen.getByTestId('dialog-modal')).toBeInTheDocument();
		expect(screen.getByTestId('modal-content')).toBeInTheDocument();

		expect(onOpen).toHaveBeenCalled();
		expect(onClose).not.toHaveBeenCalled();

		rerender(
			<Modal modalOpen={false} onOpen={onOpen} onClose={onClose}>
				<div>Modal Content</div>
			</Modal>,
		);

		await waitFor(() => {
			expect(onClose).toHaveBeenCalledOnce();
		});
		expect(onOpen).toHaveBeenCalledOnce();
	});
});

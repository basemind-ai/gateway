import { fireEvent, render, screen, waitFor } from 'tests/test-utils';

import { PasswordResetModal } from '@/components/sign-in/password-reset-modal';

describe('PasswordResetModal tests', () => {
	it('renders correctly', async () => {
		render(
			<PasswordResetModal
				handleCloseModal={vi.fn()}
				handleResetPassword={vi.fn()}
			/>,
		);

		await waitFor(() => {
			expect(
				screen.getByTestId('password-reset-modal'),
			).toBeInTheDocument();
		});

		expect(
			screen.getByTestId('password-reset-input-container'),
		).toBeInTheDocument();
		expect(
			screen.getByTestId('password-reset-input-label'),
		).toBeInTheDocument();
		expect(screen.getByTestId('password-reset-input')).toBeInTheDocument();
		expect(
			screen.getByTestId('password-reset-button-container'),
		).toBeInTheDocument();
		expect(
			screen.getByTestId('password-reset-cancel-button'),
		).toBeInTheDocument();
		expect(
			screen.getByTestId('password-reset-submit-button'),
		).toBeInTheDocument();
	});

	it('calls handleResetPassword when submit button is clicked', async () => {
		const handleResetPassword = vi.fn();
		render(
			<PasswordResetModal
				handleCloseModal={vi.fn()}
				handleResetPassword={handleResetPassword}
			/>,
		);

		await waitFor(() => {
			expect(
				screen.getByTestId('password-reset-modal'),
			).toBeInTheDocument();
		});

		const input = screen.getByTestId('password-reset-input');

		fireEvent.change(input, { target: { value: 'valid@email.com' } });

		const submitButton = screen.getByTestId('password-reset-submit-button');
		expect(submitButton).toBeEnabled();

		fireEvent.click(submitButton);

		expect(handleResetPassword).toHaveBeenCalled();
	});

	it('calls handleCloseModal when cancel button is clicked', async () => {
		const handleCloseModal = vi.fn();
		render(
			<PasswordResetModal
				handleCloseModal={handleCloseModal}
				handleResetPassword={vi.fn()}
			/>,
		);

		await waitFor(() => {
			expect(
				screen.getByTestId('password-reset-modal'),
			).toBeInTheDocument();
		});

		const cancelButton = screen.getByTestId('password-reset-cancel-button');

		fireEvent.click(cancelButton);

		expect(handleCloseModal).toHaveBeenCalled();
	});

	it('disables submit button when email is invalid', async () => {
		const handleResetPassword = vi.fn();
		render(
			<PasswordResetModal
				handleCloseModal={vi.fn()}
				handleResetPassword={handleResetPassword}
			/>,
		);

		await waitFor(() => {
			expect(
				screen.getByTestId('password-reset-modal'),
			).toBeInTheDocument();
		});

		const input = screen.getByTestId('password-reset-input');

		fireEvent.change(input, { target: { value: 'invalidemail' } });

		const submitButton = screen.getByTestId('password-reset-submit-button');
		expect(submitButton).toBeDisabled();
	});
});

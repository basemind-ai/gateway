import { UserInfo } from '@firebase/auth';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { render } from 'tests/test-utils';

import * as supportAPI from '@/api/support-api';
import { Contact } from '@/components/support/contact';
import { SupportTopic } from '@/constants/forms';

describe('Contact component', () => {
	const mockUser: UserInfo = {
		phoneNumber: '',
		providerId: '',
		uid: '',
		displayName: 'Skywalker',
		email: 'Skywalker@gmail.com',
		photoURL: 'https://picsum.photos/200',
	};
	const handleSupportTicketSpy = vi.spyOn(
		supportAPI,
		'handleCreateSupportTicket',
	);
	it('renders the topics options', () => {
		render(<Contact user={mockUser} />);
		Object.values(SupportTopic).forEach((topic) => {
			expect(screen.getByTestId(topic)).toBeInTheDocument();
		});
	});
	it('submit support button is disabled by default', () => {
		render(<Contact user={mockUser} />);
		const submitButton = screen.getByTestId('support-submit');
		expect(submitButton).toBeDisabled();
	});
	it('submit support button is enabled when topic is selected', () => {
		render(<Contact user={mockUser} />);
		const submitButton = screen.getByTestId('support-submit');
		const input = screen.getByTestId('dropdown-input-select');
		fireEvent.change(input, { target: { value: SupportTopic.API } });
		expect(submitButton).toBeEnabled();
	});
	it('submit support is disabled when user is null', () => {
		render(<Contact user={null} />);
		const submitButton = screen.getByTestId('support-submit');
		const input = screen.getByTestId('dropdown-input-select');
		fireEvent.change(input, { target: { value: SupportTopic.API } });
		expect(submitButton).toBeDisabled();
	});
	it('submit support runs handleSubmitTicket', async () => {
		render(<Contact user={mockUser} />);
		const submitButton = screen.getByTestId('support-submit');
		const input = screen.getByTestId('dropdown-input-select');
		fireEvent.change(input, { target: { value: SupportTopic.API } });
		expect(submitButton).toBeEnabled();
		fireEvent.click(submitButton);
		await waitFor(() => {
			expect(handleSupportTicketSpy).toHaveBeenCalledWith(
				SupportTopic.API,
				'',
				mockUser,
			);
		});
	});

	it('reset values after successful submit', async () => {
		handleSupportTicketSpy.mockResolvedValueOnce();
		render(<Contact user={mockUser} />);
		const submitButton = screen.getByTestId('support-submit');
		const input = screen.getByTestId('dropdown-input-select');
		fireEvent.change(input, { target: { value: SupportTopic.API } });
		expect(submitButton).toBeEnabled();
		fireEvent.click(submitButton);
		await waitFor(() => {
			expect(input).toHaveValue(SupportTopic.None);
		});
	});
});

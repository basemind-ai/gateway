import { UserInfo } from '@firebase/auth';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { render } from 'tests/test-utils';

import * as projectUsersAPI from '@/api/project-users-api';
import { Contact } from '@/components/support/contact';
import { SupportTopics } from '@/constants/forms';

describe('ContactUs component', () => {
	const mockUser: UserInfo = {
		phoneNumber: '',
		providerId: '',
		uid: '',
		displayName: 'Skywalker',
		email: 'Skywalker@gmail.com',
		photoURL: 'https://picsum.photos/200',
	};

	it('renders the topics options', () => {
		render(<Contact user={mockUser} />);
		Object.values(SupportTopics).forEach((topic) => {
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
		const input = screen.getByTestId('support-input-topic');
		fireEvent.change(input, { target: { value: SupportTopics.API } });
		expect(submitButton).toBeEnabled();
	});
	it('submit support is disabled when user is null', () => {
		render(<Contact user={null} />);
		const submitButton = screen.getByTestId('support-submit');
		const input = screen.getByTestId('support-input-topic');
		fireEvent.change(input, { target: { value: SupportTopics.API } });
		expect(submitButton).toBeDisabled();
	});
	it('submit support runs handleSubmitTicket', async () => {
		const handleSupportTicketSpy = vi.spyOn(
			projectUsersAPI,
			'handleSupportTicket',
		);
		render(<Contact user={mockUser} />);
		const submitButton = screen.getByTestId('support-submit');
		const input = screen.getByTestId('support-input-topic');
		fireEvent.change(input, { target: { value: SupportTopics.API } });
		expect(submitButton).toBeEnabled();
		fireEvent.click(submitButton);
		await waitFor(() => {
			expect(handleSupportTicketSpy).toHaveBeenCalledWith(
				SupportTopics.API,
				'',
				mockUser,
			);
		});
	});
});

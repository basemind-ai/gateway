import { ProjectFactory } from 'tests/factories';
import { fireEvent, render, screen, waitFor } from 'tests/test-utils';

import * as projectAPI from '@/api/projects-api';
import * as supportAPI from '@/api/support-api';
import { ContactForm } from '@/components/support/contact-form';
import { SupportTopic } from '@/constants/forms';

describe('Contact component', () => {
	const handleSupportTicketSpy = vi.spyOn(
		supportAPI,
		'handleCreateSupportTicket',
	);

	it('renders the topics options', () => {
		render(<ContactForm isAuthenticated={false} />);
		for (const topic of Object.values(SupportTopic)) {
			expect(screen.getByText(topic)).toBeInTheDocument();
		}
	});

	it('submit support button is disabled by default', () => {
		render(<ContactForm isAuthenticated={false} />);
		const submitButton = screen.getByTestId('support-submit');
		expect(submitButton).toBeDisabled();
	});

	it('submit support button is enabled when topic, subject and body has values', () => {
		render(<ContactForm isAuthenticated={false} />);
		const submitButton = screen.getByTestId('support-submit');
		expect(submitButton).toBeDisabled();
		fireEvent.change(screen.getByTestId(`topic-select`), {
			target: { value: SupportTopic.API },
		});
		expect(submitButton).toBeDisabled();
		fireEvent.change(screen.getByTestId('support-subject'), {
			target: { value: 'test' },
		});
		expect(submitButton).toBeDisabled();
		fireEvent.change(screen.getByTestId('support-body'), {
			target: { value: 'test' },
		});
		expect(submitButton).toBeEnabled();
	});

	it('submit support runs handleSubmitTicket', async () => {
		vi.spyOn(projectAPI, 'handleRetrieveProjects').mockResolvedValueOnce(
			await ProjectFactory.batch(2),
		);
		render(<ContactForm isAuthenticated={true} />);
		const submitButton = screen.getByTestId('support-submit');
		fireEvent.change(screen.getByTestId(`topic-select`), {
			target: { value: SupportTopic.API },
		});
		fireEvent.change(screen.getByTestId('support-subject'), {
			target: { value: 'test' },
		});
		fireEvent.change(screen.getByTestId('support-body'), {
			target: { value: 'test' },
		});
		fireEvent.click(submitButton);

		await waitFor(() => {
			expect(handleSupportTicketSpy).toHaveBeenCalledWith({
				body: 'test',
				projectId: 'null',
				subject: 'test',
				topic: SupportTopic.API,
			});
		});
	});

	it('reset values after successful submit', async () => {
		handleSupportTicketSpy.mockResolvedValueOnce();
		vi.spyOn(projectAPI, 'handleRetrieveProjects').mockResolvedValueOnce(
			await ProjectFactory.batch(2),
		);
		render(<ContactForm isAuthenticated={true} />);
		const submitButton = screen.getByTestId('support-submit');
		fireEvent.change(screen.getByTestId(`topic-select`), {
			target: { value: SupportTopic.API },
		});
		const subjectInput = screen.getByTestId('support-subject');
		fireEvent.change(screen.getByTestId('support-subject'), {
			target: { value: 'test subject' },
		});
		const bodyInput = screen.getByTestId('support-body');
		fireEvent.change(bodyInput, {
			target: { value: 'test body' },
		});
		fireEvent.click(submitButton);
		await waitFor(() => {
			expect(subjectInput).toHaveValue('');
		});
		expect(bodyInput).toHaveValue('');
	});

	it('should call handleRetrieveProjects', async () => {
		vi.spyOn(projectAPI, 'handleRetrieveProjects').mockResolvedValueOnce(
			[],
		);
		render(<ContactForm isAuthenticated={true} />);
		await waitFor(() => {
			expect(projectAPI.handleRetrieveProjects).toHaveBeenCalled();
		});
	});
});

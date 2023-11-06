import { fireEvent, screen, waitFor } from '@testing-library/react';
import { useTranslations } from 'next-intl';
import { ProjectFactory } from 'tests/factories';
import { render, renderHook } from 'tests/test-utils';

import * as projectAPI from '@/api/projects-api';
import * as supportAPI from '@/api/support-api';
import { Contact } from '@/components/support/contact';
import { SupportTopic } from '@/constants/forms';

describe('Contact component', () => {
	const {
		result: { current: t },
	} = renderHook(() => useTranslations('support'));
	const handleSupportTicketSpy = vi.spyOn(
		supportAPI,
		'handleCreateSupportTicket',
	);

	it('renders the topics options', () => {
		render(<Contact isAuthenticated={false} />);
		Object.values(SupportTopic).forEach((topic) => {
			expect(screen.getByTestId(topic)).toBeInTheDocument();
		});
	});

	it('submit support button is disabled by default', () => {
		render(<Contact isAuthenticated={false} />);
		const submitButton = screen.getByTestId('support-submit');
		expect(submitButton).toBeDisabled();
	});

	it('submit support button is enabled when topic, subject and body has values', () => {
		render(<Contact isAuthenticated={false} />);
		const submitButton = screen.getByTestId('support-submit');
		expect(submitButton).toBeDisabled();
		fireEvent.change(
			screen.getByTestId(`dropdown-input-select-${t('helpTopic')}`),
			{
				target: { value: SupportTopic.API },
			},
		);
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
		render(<Contact isAuthenticated={true} />);
		const submitButton = screen.getByTestId('support-submit');
		fireEvent.change(
			screen.getByTestId(`dropdown-input-select-${t('helpTopic')}`),
			{
				target: { value: SupportTopic.API },
			},
		);
		fireEvent.change(screen.getByTestId('support-subject'), {
			target: { value: 'test' },
		});
		fireEvent.change(screen.getByTestId('support-body'), {
			target: { value: 'test' },
		});
		fireEvent.click(submitButton);
		await waitFor(() => {
			expect(handleSupportTicketSpy).toHaveBeenCalledWith({
				topic: SupportTopic.API,
				subject: 'test',
				body: 'test',
				projectId: 'null',
			});
		});
	});

	it('reset values after successful submit', async () => {
		handleSupportTicketSpy.mockResolvedValueOnce();
		vi.spyOn(projectAPI, 'handleRetrieveProjects').mockResolvedValueOnce(
			await ProjectFactory.batch(2),
		);
		render(<Contact isAuthenticated={true} />);
		const submitButton = screen.getByTestId('support-submit');
		fireEvent.change(
			screen.getByTestId(`dropdown-input-select-${t('helpTopic')}`),
			{
				target: { value: SupportTopic.API },
			},
		);
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
		render(<Contact isAuthenticated={true} />);
		await waitFor(() => {
			expect(projectAPI.handleRetrieveProjects).toHaveBeenCalled();
		});
	});
});

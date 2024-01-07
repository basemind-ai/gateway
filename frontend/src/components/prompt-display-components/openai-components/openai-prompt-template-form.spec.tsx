import { OpenAIContentMessageFactory } from 'tests/factories';
import { fireEvent, render, screen, waitFor } from 'tests/test-utils';

import { OpenAIPromptTemplateForm } from '@/components/prompt-display-components/openai-components/openai-prompt-template-form';
import { OpenAIContentMessage, OpenAIPromptMessageRole } from '@/types';

describe('OpenAIPromptTemplateForm test', () => {
	it('should render multiple messages correctly', async () => {
		const setMessages = vi.fn();
		const messages = [] as OpenAIContentMessage[];

		render(
			<OpenAIPromptTemplateForm
				setMessages={setMessages}
				messages={messages}
			/>,
		);

		await waitFor(() => {
			expect(
				screen.getByTestId('openai-prompt-template-form'),
			).toBeInTheDocument();
		});

		await waitFor(() => {
			expect(setMessages).toHaveBeenCalledWith([
				{
					content: '',
					role: 'user',
				},
			]);
		});

		const addMessageButton = screen.getByTestId(
			'openai-prompt-template-form-add-message-button',
		);

		fireEvent.click(addMessageButton);

		await waitFor(() => {
			expect(setMessages).toHaveBeenCalledWith([
				{
					content: '',
					role: 'user',
				},
				{
					content: '',
					role: 'user',
				},
			]);
		});

		fireEvent.click(addMessageButton);

		expect(setMessages).toHaveBeenCalledWith([
			{
				content: '',
				role: 'user',
			},
			{
				content: '',
				role: 'user',
			},
			{
				content: '',
				role: 'user',
			},
		]);

		const messageElements: HTMLDivElement[] = screen.getAllByTestId(
			'openai-message-container',
		);

		expect(messageElements).toHaveLength(3);
		expect(screen.getAllByTestId('openai-message-arrow-up')).toHaveLength(
			2,
		);
		expect(screen.getAllByTestId('openai-message-arrow-down')).toHaveLength(
			2,
		);

		expect(
			(messageElements[0].firstChild as HTMLDivElement).firstChild,
		).toHaveAttribute('data-testid', 'openai-message-arrow-down');

		expect(
			(messageElements[1].firstChild as HTMLDivElement).firstChild,
		).toHaveAttribute('data-testid', 'openai-message-arrow-up');

		expect(
			(messageElements[1].firstChild as HTMLDivElement).lastChild,
		).toHaveAttribute('data-testid', 'openai-message-arrow-down');

		expect(
			(messageElements[2].firstChild as HTMLDivElement).firstChild,
		).toHaveAttribute('data-testid', 'openai-message-arrow-up');
	});

	it('allows message reordering', async () => {
		const setMessages = vi.fn();
		const messages = OpenAIContentMessageFactory.batchSync(3);

		messages[0].role = OpenAIPromptMessageRole.User;
		messages[1].role = OpenAIPromptMessageRole.System;

		render(
			<OpenAIPromptTemplateForm
				setMessages={setMessages}
				messages={messages}
			/>,
		);

		await waitFor(() => {
			expect(
				screen.getByTestId('openai-prompt-template-form'),
			).toBeInTheDocument();
		});
		const selects: HTMLSelectElement[] = screen.getAllByTestId(
			'openai-message-role-select',
		);
		expect(selects[0].value).toBe('user');
		expect(selects[1].value).toBe('system');

		const upButton = screen.getAllByTestId('openai-message-arrow-down')[0];
		fireEvent.click(upButton);

		await waitFor(() => {
			expect(
				(
					screen.getAllByTestId(
						'openai-message-role-select',
					)[0] as HTMLSelectElement
				).value,
			).toBe('system');
		});

		expect(
			(
				screen.getAllByTestId(
					'openai-message-role-select',
				)[1] as HTMLSelectElement
			).value,
		).toBe('user');
	});

	it('allows message deletion', async () => {
		const setMessages = vi.fn();
		const messages = OpenAIContentMessageFactory.batchSync(3);

		messages[0].role = OpenAIPromptMessageRole.User;
		messages[1].role = OpenAIPromptMessageRole.System;

		render(
			<OpenAIPromptTemplateForm
				setMessages={setMessages}
				messages={messages}
			/>,
		);

		await waitFor(() => {
			expect(
				screen.getByTestId('openai-prompt-template-form'),
			).toBeInTheDocument();
		});

		const deleteButton = screen.getAllByTestId(
			'openai-message-delete-button',
		)[0];
		fireEvent.click(deleteButton);

		await waitFor(() => {
			expect(setMessages).toHaveBeenCalledWith([
				messages[1],
				messages[2],
			]);
		});
	});

	it('allows message content editing', async () => {
		const setMessages = vi.fn();
		const messages = OpenAIContentMessageFactory.batchSync(3);

		messages[0].role = OpenAIPromptMessageRole.User;
		messages[1].role = OpenAIPromptMessageRole.System;

		render(
			<OpenAIPromptTemplateForm
				setMessages={setMessages}
				messages={messages}
			/>,
		);

		await waitFor(() => {
			expect(
				screen.getByTestId('openai-prompt-template-form'),
			).toBeInTheDocument();
		});

		const inputs = screen.getAllByTestId('openai-message-content-textarea');
		expect(inputs).toHaveLength(3);

		fireEvent.change(inputs[0], { target: { value: 'Test' } });

		await waitFor(() => {
			expect(setMessages).toHaveBeenCalledWith([
				{
					...messages[0],
					content: 'Test',
				},
				messages[1],
				messages[2],
			]);
		});
	});

	it('allows message name editing', async () => {
		const setMessages = vi.fn();
		const messages = OpenAIContentMessageFactory.batchSync(3);

		messages[0].role = OpenAIPromptMessageRole.User;
		messages[1].role = OpenAIPromptMessageRole.System;

		render(
			<OpenAIPromptTemplateForm
				setMessages={setMessages}
				messages={messages}
			/>,
		);

		await waitFor(() => {
			expect(
				screen.getByTestId('openai-prompt-template-form'),
			).toBeInTheDocument();
		});

		const input = screen.getAllByTestId('openai-message-name-input')[0];
		fireEvent.change(input, { target: { value: 'Test' } });

		await waitFor(() => {
			expect(setMessages).toHaveBeenCalledWith([
				{
					...messages[0],
					name: 'Test',
				},
				messages[1],
				messages[2],
			]);
		});
	});

	it('allows message role editing', async () => {
		const setMessages = vi.fn();
		const messages = OpenAIContentMessageFactory.batchSync(3);

		messages[0].role = OpenAIPromptMessageRole.User;
		messages[1].role = OpenAIPromptMessageRole.System;

		render(
			<OpenAIPromptTemplateForm
				setMessages={setMessages}
				messages={messages}
			/>,
		);

		await waitFor(() => {
			expect(
				screen.getByTestId('openai-prompt-template-form'),
			).toBeInTheDocument();
		});

		const select = screen.getAllByTestId('openai-message-role-select')[0];
		fireEvent.change(select, { target: { value: 'system' } });

		await waitFor(() => {
			expect(setMessages).toHaveBeenCalledWith([
				{
					...messages[0],
					role: 'system',
				},
				messages[1],
				messages[2],
			]);
		});
	});
});

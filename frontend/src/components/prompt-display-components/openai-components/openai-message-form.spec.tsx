import { nanoid } from 'nanoid';
import {
	fireEvent,
	getLocaleNamespace,
	render,
	screen,
	waitFor,
} from 'tests/test-utils';
import { expect } from 'vitest';

import { OpenAIMessageForm } from '@/components/prompt-display-components/openai-components/openai-message-form';
import { OpenAIPromptMessageRole } from '@/types';

describe('OpenAIMessageForm', () => {
	const locales = getLocaleNamespace('openaiPromptTemplate');

	it('should render the message form with the passed in values', async () => {
		const id = nanoid();
		const content = 'you are a beautiful bot';
		const name = 'msg-1';
		const role = OpenAIPromptMessageRole.User;

		render(
			<OpenAIMessageForm
				id={id}
				role={role}
				setRole={vi.fn()}
				name={'msg-1'}
				setName={vi.fn()}
				content={content}
				setContent={vi.fn()}
				handleDeleteMessage={vi.fn()}
				handleArrowUp={vi.fn()}
				handleArrowDown={vi.fn()}
				showArrowUp={true}
				showArrowDown={true}
			/>,
		);

		await waitFor(() => {
			const container = screen.getByTestId(
				`openai-message-container-${id}`,
			);
			expect(container).toBeInTheDocument();
		});

		const arrowUp = screen.getByTestId(`openai-message-arrow-up-${id}`);
		expect(arrowUp).toBeInTheDocument();

		const arrowDown = screen.getByTestId(`openai-message-arrow-down-${id}`);
		expect(arrowDown).toBeInTheDocument();

		const roleSelectLabel = screen.getByTestId(
			`openai-message-role-select-label-${id}`,
		);
		expect(roleSelectLabel).toBeInTheDocument();
		expect(roleSelectLabel).toHaveTextContent(locales.messageRole);

		const roleSelect: HTMLSelectElement = screen.getByTestId(
			`openai-message-role-select-${id}`,
		);
		expect(roleSelect).toBeInTheDocument();
		expect(roleSelect).toHaveValue(role);
		expect(roleSelect.options).toHaveLength(3);

		const nameInputLabel = screen.getByTestId(
			`openai-message-name-input-label-${id}`,
		);
		expect(nameInputLabel).toBeInTheDocument();
		expect(nameInputLabel).toHaveTextContent(locales.messageName);
		expect(nameInputLabel).toHaveTextContent(locales.optional);

		const messageNameInput: HTMLInputElement = screen.getByTestId(
			`openai-message-name-input-${id}`,
		);
		expect(messageNameInput).toBeInTheDocument();
		expect(messageNameInput).toHaveValue(name);

		const messageContentLabel = screen.getByTestId(
			`openai-message-content-textarea-label-${id}`,
		);
		expect(messageContentLabel).toBeInTheDocument();
		expect(messageContentLabel).toHaveTextContent(locales.messageContent);
		expect(messageContentLabel).toHaveTextContent(
			locales.wrapVariable.replaceAll("'", ''),
		);

		const messageContentTextarea: HTMLTextAreaElement = screen.getByTestId(
			`openai-message-content-textarea-${id}`,
		);
		expect(messageContentTextarea).toBeInTheDocument();
		expect(messageContentTextarea).toHaveValue(content);

		const deleteMessageButton = screen.getByTestId(
			`openai-message-delete-button-${id}`,
		);
		expect(deleteMessageButton).toBeInTheDocument();
	});

	it('should render the expected placeholder values', async () => {
		const id = nanoid();
		const role = OpenAIPromptMessageRole.User;

		render(
			<OpenAIMessageForm
				id={id}
				role={role}
				setRole={vi.fn()}
				name={undefined}
				setName={vi.fn()}
				content={''}
				setContent={vi.fn()}
				handleDeleteMessage={vi.fn()}
				handleArrowUp={vi.fn()}
				handleArrowDown={vi.fn()}
				showArrowUp={true}
				showArrowDown={true}
			/>,
		);

		await waitFor(() => {
			const container = screen.getByTestId(
				`openai-message-container-${id}`,
			);
			expect(container).toBeInTheDocument();
		});
		const messageNameInput: HTMLInputElement = screen.getByTestId(
			`openai-message-name-input-${id}`,
		);
		expect(messageNameInput).toBeInTheDocument();
		expect(messageNameInput.placeholder).toBe(
			locales.messageNameInputPlaceholder,
		);

		const messageContentTextarea: HTMLTextAreaElement = screen.getByTestId(
			`openai-message-content-textarea-${id}`,
		);
		expect(messageContentTextarea).toBeInTheDocument();
		expect(messageContentTextarea.placeholder).toBe(
			locales.messageContentPlaceholder.replaceAll("'", ''),
		);
	});

	it('should set message role', async () => {
		const id = nanoid();
		const role = OpenAIPromptMessageRole.User;

		const setRole = vi.fn();

		render(
			<OpenAIMessageForm
				id={id}
				role={role}
				setRole={setRole}
				name={''}
				setName={vi.fn()}
				content={''}
				setContent={vi.fn()}
				handleDeleteMessage={vi.fn()}
				handleArrowUp={vi.fn()}
				handleArrowDown={vi.fn()}
				showArrowUp={true}
				showArrowDown={true}
			/>,
		);

		await waitFor(() => {
			const container = screen.getByTestId(
				`openai-message-container-${id}`,
			);
			expect(container).toBeInTheDocument();
		});

		const roleSelect: HTMLSelectElement = screen.getByTestId(
			`openai-message-role-select-${id}`,
		);
		expect(roleSelect).toHaveValue(role);

		fireEvent.change(roleSelect, {
			target: { value: OpenAIPromptMessageRole.System },
		});
		expect(setRole).toHaveBeenCalledWith(OpenAIPromptMessageRole.System);
	});

	it('should set message name', async () => {
		const id = nanoid();
		const name = '';
		const setName = vi.fn();

		render(
			<OpenAIMessageForm
				id={id}
				role={OpenAIPromptMessageRole.User}
				setRole={vi.fn()}
				name={name}
				setName={setName}
				content={''}
				setContent={vi.fn()}
				handleDeleteMessage={vi.fn()}
				handleArrowUp={vi.fn()}
				handleArrowDown={vi.fn()}
				showArrowUp={true}
				showArrowDown={true}
			/>,
		);

		await waitFor(() => {
			const container = screen.getByTestId(
				`openai-message-container-${id}`,
			);
			expect(container).toBeInTheDocument();
		});

		const messageNameInput: HTMLInputElement = screen.getByTestId(
			`openai-message-name-input-${id}`,
		);
		expect(messageNameInput).toHaveValue('');

		fireEvent.change(messageNameInput, { target: { value: 'msg-2' } });
		expect(setName).toHaveBeenCalledWith('msg-2');
	});

	it('should set message content', async () => {
		const id = nanoid();
		const content = '';
		const setContent = vi.fn();

		render(
			<OpenAIMessageForm
				id={id}
				role={OpenAIPromptMessageRole.User}
				setRole={vi.fn()}
				name={''}
				setName={vi.fn()}
				content={content}
				setContent={setContent}
				handleDeleteMessage={vi.fn()}
				handleArrowUp={vi.fn()}
				handleArrowDown={vi.fn()}
				showArrowUp={true}
				showArrowDown={true}
			/>,
		);

		await waitFor(() => {
			const container = screen.getByTestId(
				`openai-message-container-${id}`,
			);
			expect(container).toBeInTheDocument();
		});

		const messageContentTextarea: HTMLTextAreaElement = screen.getByTestId(
			`openai-message-content-textarea-${id}`,
		);
		expect(messageContentTextarea).toHaveValue('');

		fireEvent.change(messageContentTextarea, {
			target: { value: 'you are a beautiful bot' },
		});
		expect(setContent).toHaveBeenCalledWith('you are a beautiful bot');
	});

	it('should delete message', async () => {
		const id = nanoid();
		const handleDeleteMessage = vi.fn();

		render(
			<OpenAIMessageForm
				id={id}
				role={OpenAIPromptMessageRole.User}
				setRole={vi.fn()}
				name={''}
				setName={vi.fn()}
				content={''}
				setContent={vi.fn()}
				handleDeleteMessage={handleDeleteMessage}
				handleArrowUp={vi.fn()}
				handleArrowDown={vi.fn()}
				showArrowUp={true}
				showArrowDown={true}
			/>,
		);

		await waitFor(() => {
			const container = screen.getByTestId(
				`openai-message-container-${id}`,
			);
			expect(container).toBeInTheDocument();
		});

		const deleteMessageButton = screen.getByTestId(
			`openai-message-delete-button-${id}`,
		);
		expect(deleteMessageButton).toBeInTheDocument();

		fireEvent.click(deleteMessageButton);
		expect(handleDeleteMessage).toHaveBeenCalled();
	});
});

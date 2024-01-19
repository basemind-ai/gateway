import {
	fireEvent,
	getLocaleNamespace,
	render,
	screen,
	waitFor,
} from 'tests/test-utils';

import { OpenAIMessageForm } from '@/components/prompt-display-components/openai-components/openai-message-form';
import { OpenAIPromptMessageRole } from '@/types';

describe('OpenAIMessageForm', () => {
	const locales = getLocaleNamespace('openaiPromptTemplate');

	it('should render the message form with the passed in values', async () => {
		const content = 'you are a beautiful bot';
		const name = 'msg-1';
		const role = OpenAIPromptMessageRole.User;

		render(
			<OpenAIMessageForm
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
			const container = screen.getByTestId(`openai-message-container`);
			expect(container).toBeInTheDocument();
		});

		const arrowUp = screen.getByTestId(`openai-message-arrow-up`);
		expect(arrowUp).toBeInTheDocument();

		const arrowDown = screen.getByTestId(`openai-message-arrow-down`);
		expect(arrowDown).toBeInTheDocument();

		const roleSelectLabel = screen.getByTestId(
			`openai-message-role-select-label`,
		);
		expect(roleSelectLabel).toBeInTheDocument();
		expect(roleSelectLabel).toHaveTextContent(locales.messageRole);

		const roleSelect: HTMLSelectElement = screen.getByTestId(
			`openai-message-role-select`,
		);
		expect(roleSelect).toBeInTheDocument();
		expect(roleSelect).toHaveValue(role);
		expect(roleSelect.options).toHaveLength(3);

		const nameInputLabel = screen.getByTestId(
			`openai-message-name-input-label`,
		);
		expect(nameInputLabel).toBeInTheDocument();
		expect(nameInputLabel).toHaveTextContent(locales.messageName);
		expect(nameInputLabel).toHaveTextContent(locales.optional);

		const messageNameInput: HTMLInputElement = screen.getByTestId(
			`openai-message-name-input`,
		);
		expect(messageNameInput).toBeInTheDocument();
		expect(messageNameInput).toHaveValue(name);

		const messageContentLabel = screen.getByTestId(
			`openai-message-content-textarea-label`,
		);
		expect(messageContentLabel).toBeInTheDocument();
		expect(messageContentLabel).toHaveTextContent(locales.messageContent);
		expect(messageContentLabel).toHaveTextContent(
			locales.wrapVariable.replaceAll("'", ''),
		);

		const messageContentTextarea: HTMLTextAreaElement = screen.getByTestId(
			`openai-message-content-textarea`,
		);
		expect(messageContentTextarea).toBeInTheDocument();
		expect(messageContentTextarea).toHaveValue(content);

		const deleteMessageButton = screen.getByTestId(
			`openai-message-delete-button`,
		);
		expect(deleteMessageButton).toBeInTheDocument();
	});

	it('should render the expected placeholder values', async () => {
		const role = OpenAIPromptMessageRole.User;

		render(
			<OpenAIMessageForm
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
			const container = screen.getByTestId(`openai-message-container`);
			expect(container).toBeInTheDocument();
		});
		const messageNameInput: HTMLInputElement = screen.getByTestId(
			`openai-message-name-input`,
		);
		expect(messageNameInput).toBeInTheDocument();
		expect(messageNameInput.placeholder).toBe(
			locales.messageNameInputPlaceholder,
		);

		const messageContentTextarea: HTMLTextAreaElement = screen.getByTestId(
			`openai-message-content-textarea`,
		);
		expect(messageContentTextarea).toBeInTheDocument();
		expect(messageContentTextarea.placeholder).toBe(
			locales.messageContentPlaceholder.replaceAll("'", ''),
		);
	});

	it('should set message role', async () => {
		const role = OpenAIPromptMessageRole.User;

		const setRole = vi.fn();

		render(
			<OpenAIMessageForm
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
			const container = screen.getByTestId(`openai-message-container`);
			expect(container).toBeInTheDocument();
		});

		const roleSelect: HTMLSelectElement = screen.getByTestId(
			`openai-message-role-select`,
		);
		expect(roleSelect).toHaveValue(role);

		fireEvent.change(roleSelect, {
			target: { value: OpenAIPromptMessageRole.System },
		});
		expect(setRole).toHaveBeenCalledWith(OpenAIPromptMessageRole.System);
	});

	it('should set message name', async () => {
		const name = '';
		const setName = vi.fn();

		render(
			<OpenAIMessageForm
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
			const container = screen.getByTestId(`openai-message-container`);
			expect(container).toBeInTheDocument();
		});

		const messageNameInput: HTMLInputElement = screen.getByTestId(
			`openai-message-name-input`,
		);
		expect(messageNameInput).toHaveValue('');

		fireEvent.change(messageNameInput, { target: { value: 'msg-2' } });
		expect(setName).toHaveBeenCalledWith('msg-2');
	});

	it('should show name error message for invalid name', async () => {
		const name = '';
		const setName = vi.fn();

		render(
			<OpenAIMessageForm
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
			const container = screen.getByTestId(`openai-message-container`);
			expect(container).toBeInTheDocument();
		});

		const messageNameInput: HTMLInputElement = screen.getByTestId(
			`openai-message-name-input`,
		);
		expect(messageNameInput).toHaveValue('');

		fireEvent.change(messageNameInput, { target: { value: 'msg 2@' } });

		await waitFor(() => {
			expect(
				screen.getByTestId('invalid-name-error-message'),
			).toBeInTheDocument();
		});
	});

	it('should set message content', async () => {
		const content = '';
		const setContent = vi.fn();

		render(
			<OpenAIMessageForm
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
			const container = screen.getByTestId(`openai-message-container`);
			expect(container).toBeInTheDocument();
		});

		const messageContentTextarea: HTMLTextAreaElement = screen.getByTestId(
			`openai-message-content-textarea`,
		);
		expect(messageContentTextarea).toHaveValue('');

		fireEvent.change(messageContentTextarea, {
			target: { value: 'you are a beautiful bot' },
		});
		expect(setContent).toHaveBeenCalledWith('you are a beautiful bot');
	});

	it('should delete message', async () => {
		const handleDeleteMessage = vi.fn();

		render(
			<OpenAIMessageForm
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
			const container = screen.getByTestId(`openai-message-container`);
			expect(container).toBeInTheDocument();
		});

		const deleteMessageButton = screen.getByTestId(
			`openai-message-delete-button`,
		);
		expect(deleteMessageButton).toBeInTheDocument();

		fireEvent.click(deleteMessageButton);
		expect(handleDeleteMessage).toHaveBeenCalled();
	});
});

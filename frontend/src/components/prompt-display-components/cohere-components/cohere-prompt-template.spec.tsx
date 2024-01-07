import {
	fireEvent,
	getLocaleNamespace,
	render,
	screen,
} from 'tests/test-utils';

import { CoherePromptTemplate } from '@/components/prompt-display-components/cohere-components/cohere-prompt-template';

describe('CoherePromptTemplate tests', () => {
	const locales = getLocaleNamespace('createConfigWizard');

	it('should display the message content textarea with the correct placeholder text', () => {
		const setMessages = vi.fn();

		render(
			<CoherePromptTemplate messages={[]} setMessages={setMessages} />,
		);

		const textArea: HTMLTextAreaElement = screen.getByTestId(
			'cohere-prompt-template-form-textarea',
		);

		expect(textArea.placeholder).toBe(
			locales.promptMessagePlaceholder.replaceAll("'", ''),
		);
	});

	it('should update the message state correctly when text is entered into the textarea', () => {
		const setMessages = vi.fn();

		render(
			<CoherePromptTemplate messages={[]} setMessages={setMessages} />,
		);

		const textarea = screen.getByTestId(
			'cohere-prompt-template-form-textarea',
		);
		fireEvent.change(textarea, { target: { value: 'Test message' } });

		expect(setMessages).toHaveBeenCalledWith([
			{
				message: 'Test message',
				templateVariables: [],
			},
		]);
	});

	it('should extract template variables correctly from the entered message', () => {
		const setMessages = vi.fn();

		render(
			<CoherePromptTemplate messages={[]} setMessages={setMessages} />,
		);

		const textarea = screen.getByTestId(
			'cohere-prompt-template-form-textarea',
		);
		fireEvent.change(textarea, { target: { value: 'Hello {name}!' } });

		expect(setMessages).toHaveBeenCalledWith([
			{
				message: 'Hello {name}!',
				templateVariables: ['name'],
			},
		]);
	});

	it('should render the form with empty message content when no messages are passed in', () => {
		const setMessages = vi.fn();

		render(
			<CoherePromptTemplate messages={[]} setMessages={setMessages} />,
		);

		expect(
			screen.getByTestId('cohere-prompt-template-form-textarea'),
		).toHaveValue('');
	});

	it('should render the form with empty message content when messages array is empty', () => {
		const setMessages = vi.fn();

		render(
			<CoherePromptTemplate messages={[]} setMessages={setMessages} />,
		);

		expect(
			screen.getByTestId('cohere-prompt-template-form-textarea'),
		).toHaveValue('');
	});

	it('should display a text info label with wrap variable instructions', () => {
		const setMessages = vi.fn();

		render(
			<CoherePromptTemplate messages={[]} setMessages={setMessages} />,
		);

		expect(
			screen.getByTestId('cohere-prompt-template-form-label-alt-text'),
		).toHaveTextContent(locales.wrapVariable.replaceAll("'", ''));
	});
});

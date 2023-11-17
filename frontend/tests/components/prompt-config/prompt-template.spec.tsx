import { fireEvent, screen } from '@testing-library/react';
import { render } from 'tests/test-utils';
import { beforeEach, describe, expect } from 'vitest';

import { OpenAIPromptTemplate } from '@/components/prompt-config/open-a-i-prompt-template';
import { DefaultOpenAIPromptConfigTest } from '@/constants/forms';
import { OpenAIPromptMessage } from '@/types';

describe('PromptTemplate tests', () => {
	let config = DefaultOpenAIPromptConfigTest;
	const setPromptTestConfig = vi.fn();
	setPromptTestConfig.mockImplementation((updater) => {
		// Replace the original config with the new state for subsequent assertions
		config = typeof updater === 'function' ? updater(config) : updater;
	});
	beforeEach(() => {
		config = DefaultOpenAIPromptConfigTest;
		config.promptMessages = [
			{
				content: 'test user',
				name: 'test name',
				role: 'user',
			},
			{
				content: 'test system',
				name: 'test system',
				role: 'system',
			},
		];
		setPromptTestConfig.mockClear();
	});

	it('should render', () => {
		render(
			<OpenAIPromptTemplate
				promptTestConfig={config}
				setPromptTestConfig={setPromptTestConfig}
			/>,
		);
		expect(screen.getByTestId('prompt-template-card')).toBeInTheDocument();
	});

	it('should render the correct number of messages', () => {
		config.promptMessages = [
			{ content: 'test user', name: 'test name', role: 'user' },
			{ content: 'test system', name: 'test system', role: 'system' },
		];
		render(
			<OpenAIPromptTemplate
				promptTestConfig={config}
				setPromptTestConfig={setPromptTestConfig}
			/>,
		);
		for (const message of config.promptMessages) {
			expect(
				screen.getByText(
					(message as OpenAIPromptMessage & { content: string })
						.content,
				),
			).toBeInTheDocument();
		}
	});

	it('message editor should have first message value', () => {
		render(
			<OpenAIPromptTemplate
				promptTestConfig={config}
				setPromptTestConfig={setPromptTestConfig}
			/>,
		);
		expect(screen.getByTestId('prompt-message-editor')).toHaveValue(
			(
				config.promptMessages[0] as OpenAIPromptMessage & {
					content: string;
				}
			).content,
		);
	});

	it('clicking on a message should change the editor value', () => {
		render(
			<OpenAIPromptTemplate
				promptTestConfig={config}
				setPromptTestConfig={setPromptTestConfig}
			/>,
		);
		fireEvent.click(screen.getByTestId('prompt-message-1'));
		expect(screen.getByTestId('prompt-message-editor')).toHaveValue(
			(
				config.promptMessages[1] as OpenAIPromptMessage & {
					content: string;
				}
			).content,
		);
	});

	it('save should be disabled when editor value is empty', () => {
		render(
			<OpenAIPromptTemplate
				promptTestConfig={config}
				setPromptTestConfig={setPromptTestConfig}
			/>,
		);
		fireEvent.change(screen.getByTestId('prompt-message-editor'), {
			target: { value: '' },
		});
		expect(screen.getByTestId('prompt-message-save')).toBeDisabled();
	});

	it('save should add a new message when a new message is selected', () => {
		render(
			<OpenAIPromptTemplate
				promptTestConfig={config}
				setPromptTestConfig={setPromptTestConfig}
			/>,
		);
		fireEvent.click(screen.getByTestId('prompt-message-new'));
		fireEvent.change(screen.getByTestId('prompt-message-editor'), {
			target: { value: 'test' },
		});
		fireEvent.click(screen.getByTestId('prompt-message-save'));
		expect(setPromptTestConfig).toHaveBeenCalledWith({
			...config,
			promptMessages: [
				{
					content: 'test user',
					name: 'test name',
					role: 'user',
				},
				{
					content: 'test system',
					name: 'test system',
					role: 'system',
				},
				{
					content: 'test',
					role: 'system',
					templateVariables: [],
				},
			],
		});
	});

	it('save should update the message on existing message is selected', () => {
		render(
			<OpenAIPromptTemplate
				promptTestConfig={config}
				setPromptTestConfig={setPromptTestConfig}
			/>,
		);
		fireEvent.click(screen.getByTestId('prompt-message-1'));
		fireEvent.change(screen.getByTestId('prompt-message-editor'), {
			target: { value: 'updated message' },
		});
		fireEvent.click(screen.getByTestId('prompt-message-save'));
		expect(setPromptTestConfig).toHaveBeenCalledWith({
			...config,
			promptMessages: [
				{
					content: 'test user',
					name: 'test name',
					role: 'user',
				},
				{
					content: 'updated message',
					name: 'test system',
					role: 'system',
					templateVariables: [],
				},
			],
		});
	});

	it('changing the role and clicking save should update the message', () => {
		render(
			<OpenAIPromptTemplate
				promptTestConfig={config}
				setPromptTestConfig={setPromptTestConfig}
			/>,
		);
		fireEvent.click(screen.getByTestId('prompt-message-1'));
		fireEvent.change(screen.getByTestId('prompt-message-role'), {
			target: { value: 'user' },
		});
		fireEvent.click(screen.getByTestId('prompt-message-save'));
		expect(setPromptTestConfig).toHaveBeenCalledWith({
			...config,
			promptMessages: [
				{
					content: 'test user',
					name: 'test name',
					role: 'user',
				},
				{
					content: 'test system',
					name: 'test system',
					role: 'user',
					templateVariables: [],
				},
			],
		});
	});

	it('changing the name and clicking save should update the message', () => {
		render(
			<OpenAIPromptTemplate
				promptTestConfig={config}
				setPromptTestConfig={setPromptTestConfig}
			/>,
		);
		fireEvent.click(screen.getByTestId('prompt-message-1'));
		fireEvent.change(screen.getByTestId('prompt-message-name'), {
			target: { value: 'new name' },
		});
		fireEvent.click(screen.getByTestId('prompt-message-save'));
		expect(setPromptTestConfig).toHaveBeenCalledWith({
			...config,
			promptMessages: [
				{
					content: 'test user',
					name: 'test name',
					role: 'user',
				},
				{
					content: 'test system',
					name: 'new name',
					role: 'system',
					templateVariables: [],
				},
			],
		});
	});

	it('delete should be disabled when new message is selected', () => {
		render(
			<OpenAIPromptTemplate
				promptTestConfig={config}
				setPromptTestConfig={setPromptTestConfig}
			/>,
		);
		fireEvent.click(screen.getByTestId('prompt-message-new'));
		expect(screen.getByTestId('prompt-message-delete')).toBeDisabled();
	});

	it('clicking delete should remove the message', () => {
		render(
			<OpenAIPromptTemplate
				promptTestConfig={config}
				setPromptTestConfig={setPromptTestConfig}
			/>,
		);
		fireEvent.click(screen.getByTestId('prompt-message-1'));
		fireEvent.click(screen.getByTestId('prompt-message-delete'));
		expect(setPromptTestConfig).toHaveBeenCalledWith({
			...config,
			promptMessages: [
				{
					content: 'test user',
					name: 'test name',
					role: 'user',
				},
			],
		});
	});

	it('clicking delete should set the first message as active', () => {
		render(
			<OpenAIPromptTemplate
				promptTestConfig={config}
				setPromptTestConfig={setPromptTestConfig}
			/>,
		);
		fireEvent.click(screen.getByTestId('prompt-message-1'));
		fireEvent.click(screen.getByTestId('prompt-message-delete'));
		expect(screen.getByTestId('prompt-message-editor')).toHaveValue(
			(
				config.promptMessages[0] as OpenAIPromptMessage & {
					content: string;
				}
			).content,
		);
	});

	it('saving a message should update the config variables', () => {
		render(
			<OpenAIPromptTemplate
				promptTestConfig={config}
				setPromptTestConfig={setPromptTestConfig}
			/>,
		);
		fireEvent.click(screen.getByTestId('prompt-message-1'));
		fireEvent.change(screen.getByTestId('prompt-message-editor'), {
			target: { value: 'update message with {variable}' },
		});
		fireEvent.click(screen.getByTestId('prompt-message-save'));
		expect(setPromptTestConfig).toHaveBeenCalledWith({
			...config,
			promptMessages: [
				{
					content: 'test user',
					name: 'test name',
					role: 'user',
				},
				{
					content: 'update message with {variable}',
					name: 'test system',
					role: 'system',
					templateVariables: ['variable'],
				},
			],
			templateVariables: { variable: '' },
		});
	});
	it('if a message dont have a name, it should be named message role and the index', () => {
		config.promptMessages = [
			{
				content: 'test user',
				role: 'user',
			},
		];
		render(
			<OpenAIPromptTemplate
				promptTestConfig={config}
				setPromptTestConfig={setPromptTestConfig}
			/>,
		);
		expect(screen.getByText('user0')).toBeInTheDocument();
		config.promptMessages = [
			{
				content: 'test user',
				name: 'now i have a name',
				role: 'user',
			},
		];
		render(
			<OpenAIPromptTemplate
				promptTestConfig={config}
				setPromptTestConfig={setPromptTestConfig}
			/>,
		);
		expect(screen.getByText('now i have a name')).toBeInTheDocument();
	});
});

import { faker } from '@faker-js/faker';
import { PromptTestRecordFactory } from 'tests/factories';
import { fireEvent, render, screen, waitFor } from 'tests/test-utils';
import { expect, Mock, MockInstance } from 'vitest';

import {
	finishReasonStyle,
	PromptConfigTesting,
} from '@/components/projects/[projectId]/applications/[applicationId]/config-create-wizard/prompt-config-testing-form';
import { usePromptTesting } from '@/hooks/use-prompt-testing';
import {
	ModelVendor,
	OpenAIContentMessage,
	OpenAIModelParameters,
	OpenAIModelType,
	PromptTestRecord,
} from '@/types';

const sendMessagesMock = vi.fn();

vi.mock('@/hooks/use-prompt-testing', () => ({
	usePromptTesting: vi.fn(() => ({
		isRunningTest: false,
		modelResponses: [],
		sendMessage: sendMessagesMock,
		testFinishReason: '',
		testRecord: {} as PromptTestRecord<any>,
	})),
}));

describe('PromptConfigTesting tests', () => {
	const mockHook = usePromptTesting as unknown as MockInstance;

	const applicationId = faker.string.uuid();
	const projectId = faker.string.uuid();
	const modelType = OpenAIModelType.Gpt35Turbo;
	const modelVendor = ModelVendor.OpenAI;
	const templateVariables = {};
	const parameters = {
		frequencyPenalty: 0,
		maxTokens: 64,
		presencePenalty: 0,
		temperature: 0.5,
		topP: 1,
	} satisfies OpenAIModelParameters;
	const messages = [
		{ content: 'you are a bot', name: 'SystemMessage', role: 'system' },
		{ content: 'Hello', name: 'UserMessage', role: 'user' },
	] as OpenAIContentMessage[];

	let handleErrorMock: Mock;
	let setTemplateVariablesMock: Mock;

	beforeEach(() => {
		handleErrorMock = vi.fn();
		setTemplateVariablesMock = vi.fn();
	});

	it('should render the passed in messages', () => {
		render(
			<PromptConfigTesting
				applicationId={applicationId}
				projectId={projectId}
				modelType={modelType}
				modelVendor={modelVendor}
				templateVariables={templateVariables}
				parameters={parameters}
				messages={messages}
				handleError={handleErrorMock}
				setTemplateVariables={setTemplateVariablesMock}
			/>,
		);

		expect(
			screen.getByTestId('prompt-config-testing-form'),
		).toBeInTheDocument();

		const messageParagraphs = screen.getAllByTestId(
			'message-content-paragraph',
		);
		expect(messageParagraphs).toHaveLength(2);
	});

	it('should render expected variables', () => {
		const messagesWithVariables = [
			...messages,
			{
				content: '{userInput}',
				role: 'user',
				templateVariables: ['userInput'],
			},
		] as OpenAIContentMessage[];

		render(
			<PromptConfigTesting
				applicationId={applicationId}
				projectId={projectId}
				modelType={modelType}
				modelVendor={modelVendor}
				templateVariables={templateVariables}
				parameters={parameters}
				messages={messagesWithVariables}
				handleError={handleErrorMock}
				setTemplateVariables={setTemplateVariablesMock}
			/>,
		);

		const variableInput = screen.getByTestId(
			'input-variable-input-userInput',
		);
		expect(variableInput).toBeInTheDocument();
	});

	it('passes an error handler', () => {
		render(
			<PromptConfigTesting
				applicationId={applicationId}
				projectId={projectId}
				modelType={modelType}
				modelVendor={modelVendor}
				templateVariables={templateVariables}
				parameters={parameters}
				messages={messages}
				handleError={handleErrorMock}
				setTemplateVariables={setTemplateVariablesMock}
			/>,
		);
		expect(handleErrorMock).not.toHaveBeenCalled();

		mockHook.mock.calls.at(-1)?.[0].handleError('test error');

		expect(handleErrorMock).toHaveBeenCalled();
	});

	it('does not allow executing the test if the test name is not set are missing', () => {
		render(
			<PromptConfigTesting
				applicationId={applicationId}
				projectId={projectId}
				modelType={modelType}
				modelVendor={modelVendor}
				templateVariables={templateVariables}
				parameters={parameters}
				messages={messages}
				handleError={handleErrorMock}
				setTemplateVariables={setTemplateVariablesMock}
			/>,
		);
		const runTestButton = screen.getByTestId('run-test-button');
		expect(runTestButton).toBeInTheDocument();
		expect(runTestButton).toBeDisabled();
	});

	it('allows executing the test if the test name is set', async () => {
		render(
			<PromptConfigTesting
				applicationId={applicationId}
				projectId={projectId}
				modelType={modelType}
				modelVendor={modelVendor}
				templateVariables={templateVariables}
				parameters={parameters}
				messages={messages}
				handleError={handleErrorMock}
				setTemplateVariables={setTemplateVariablesMock}
			/>,
		);

		const testNameInput = screen.getByTestId('test-name-input');
		expect(testNameInput).toBeInTheDocument();

		const runTestButton = screen.getByTestId('run-test-button');
		expect(runTestButton).toBeInTheDocument();

		fireEvent.change(testNameInput, { target: { value: 'test' } });

		await waitFor(() => {
			expect(runTestButton).toBeEnabled();
		});
	});

	it('does not allow executing the test if a template variable is missing', () => {
		const messagesWithVariables = [
			...messages,
			{
				content: '{userInput}',
				role: 'user',
				templateVariables: ['userInput'],
			},
		] as OpenAIContentMessage[];

		render(
			<PromptConfigTesting
				applicationId={applicationId}
				projectId={projectId}
				modelType={modelType}
				modelVendor={modelVendor}
				templateVariables={templateVariables}
				parameters={parameters}
				messages={messagesWithVariables}
				handleError={handleErrorMock}
				setTemplateVariables={setTemplateVariablesMock}
			/>,
		);

		const testNameInput = screen.getByTestId('test-name-input');
		expect(testNameInput).toBeInTheDocument();

		const runTestButton = screen.getByTestId('run-test-button');
		expect(runTestButton).toBeInTheDocument();

		fireEvent.change(testNameInput, { target: { value: 'test' } });

		expect(runTestButton).toBeDisabled();
	});

	it('allows executing the test if all template variables are set', async () => {
		const messagesWithVariables = [
			...messages,
			{
				content: '{userInput}',
				role: 'user',
				templateVariables: ['userInput'],
			},
		] as OpenAIContentMessage[];

		const { rerender } = render(
			<PromptConfigTesting
				applicationId={applicationId}
				projectId={projectId}
				modelType={modelType}
				modelVendor={modelVendor}
				templateVariables={{}}
				parameters={parameters}
				messages={messagesWithVariables}
				handleError={handleErrorMock}
				setTemplateVariables={setTemplateVariablesMock}
			/>,
		);

		const testNameInput = screen.getByTestId('test-name-input');
		expect(testNameInput).toBeInTheDocument();

		const runTestButton = screen.getByTestId('run-test-button');
		expect(runTestButton).toBeInTheDocument();

		const templateVariableInput = screen.getByTestId(
			'input-variable-input-userInput',
		);
		expect(templateVariableInput).toBeInTheDocument();

		fireEvent.change(testNameInput, { target: { value: 'test' } });
		fireEvent.change(templateVariableInput, { target: { value: 'test' } });

		await waitFor(() => {
			expect(setTemplateVariablesMock).toHaveBeenCalled();
		});

		rerender(
			<PromptConfigTesting
				applicationId={applicationId}
				projectId={projectId}
				modelType={modelType}
				modelVendor={modelVendor}
				templateVariables={{ userInput: 'test' }}
				parameters={parameters}
				messages={messagesWithVariables}
				handleError={handleErrorMock}
				setTemplateVariables={setTemplateVariablesMock}
			/>,
		);

		await waitFor(() => {
			expect(runTestButton).toBeEnabled();
		});
	});

	it('runs the test and displays the results', async () => {
		const { rerender } = render(
			<PromptConfigTesting
				applicationId={applicationId}
				projectId={projectId}
				modelType={modelType}
				modelVendor={modelVendor}
				templateVariables={templateVariables}
				parameters={parameters}
				messages={messages}
				handleError={handleErrorMock}
				setTemplateVariables={setTemplateVariablesMock}
			/>,
		);

		const testNameInput = screen.getByTestId('test-name-input');
		expect(testNameInput).toBeInTheDocument();

		const runTestButton = screen.getByTestId('run-test-button');
		expect(runTestButton).toBeInTheDocument();

		fireEvent.change(testNameInput, { target: { value: 'test' } });

		await waitFor(() => {
			expect(runTestButton).toBeEnabled();
		});

		fireEvent.click(runTestButton);

		expect(sendMessagesMock).toHaveBeenCalledTimes(1);
		expect(sendMessagesMock).toHaveBeenCalledWith({
			modelParameters: parameters,
			modelType,
			modelVendor,
			name: 'test',
			promptConfigId: undefined,
			promptMessages: messages,
			templateVariables,
		});

		mockHook.mockReturnValueOnce({
			isRunningTest: true,
			modelResponses: [{ content: 'test bot response' }],
			sendMessage: sendMessagesMock,
			testFinishReason: '',
			testRecord: {} as PromptTestRecord<any>,
		});

		rerender(
			<PromptConfigTesting
				applicationId={applicationId}
				projectId={projectId}
				modelType={modelType}
				modelVendor={modelVendor}
				templateVariables={templateVariables}
				parameters={parameters}
				messages={messages}
				handleError={handleErrorMock as any}
				setTemplateVariables={setTemplateVariablesMock as any}
			/>,
		);

		const responseContainer = screen.getByTestId(
			'model-response-container',
		);
		await waitFor(() => {
			expect(responseContainer).toBeInTheDocument();
		});
		expect(responseContainer).toHaveTextContent('test bot response');
	});

	it('displays the finish reason and other data when the test finishes', () => {
		const testRecord = PromptTestRecordFactory.buildSync();

		mockHook.mockReturnValueOnce({
			isRunningTest: false,
			modelResponses: [{ content: 'test bot response' }],
			sendMessage: sendMessagesMock,
			testFinishReason: 'done',
			testRecord,
		});

		render(
			<PromptConfigTesting
				applicationId={applicationId}
				projectId={projectId}
				modelType={modelType}
				modelVendor={modelVendor}
				templateVariables={templateVariables}
				parameters={parameters}
				messages={messages}
				handleError={handleErrorMock}
				setTemplateVariables={setTemplateVariablesMock}
			/>,
		);
		const vendorDisplay = screen.getByTestId('test-model-vendor-display');
		expect(vendorDisplay).toBeInTheDocument();
		const modelDisplay = screen.getByTestId('test-model-type-display');
		expect(modelDisplay).toBeInTheDocument();
		const finishReasonDisplay = screen.getByTestId(
			'test-finish-reason-display',
		);
		expect(finishReasonDisplay).toBeInTheDocument();
		const latencyDisplay = screen.getByTestId('test-duration-display');
		expect(latencyDisplay).toBeInTheDocument();
		const requestTokensDisplay = screen.getByTestId(
			'test-request-tokens-display',
		);
		expect(requestTokensDisplay).toBeInTheDocument();
		const responseTokensDisplay = screen.getByTestId(
			'test-response-tokens-display',
		);
		expect(responseTokensDisplay).toBeInTheDocument();
	});
});

describe('finishReasonStyle tests', () => {
	it('returns the correct style for done', () => {
		expect(finishReasonStyle('done')).toBe('text-success');
	});

	it('returns the correct style for error', () => {
		expect(finishReasonStyle('error')).toBe('text-error');
	});

	it('returns the correct style for other', () => {
		expect(finishReasonStyle('other')).toBe('text-warning');
	});
});

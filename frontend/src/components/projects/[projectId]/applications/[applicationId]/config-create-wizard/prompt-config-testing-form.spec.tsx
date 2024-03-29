import { faker } from '@faker-js/faker';
import { PromptTestRecordFactory } from 'tests/factories';
import { fireEvent, render, screen, waitFor } from 'tests/test-utils';
import { Mock, MockInstance } from 'vitest';

import {
	finishReasonStyle,
	PromptConfigTestingForm,
} from '@/components/projects/[projectId]/applications/[applicationId]/config-create-wizard/prompt-config-testing-form';
import { usePromptTesting } from '@/hooks/use-prompt-testing';
import {
	ModelVendor,
	OpenAIModelParameters,
	OpenAIModelType,
	OpenAIPromptMessage,
	PromptTestRecord,
} from '@/types';

const sendMessagesMock = vi.fn();
const resetStateMock = vi.fn();

vi.mock('@/hooks/use-prompt-testing', () => ({
	usePromptTesting: vi.fn(() => ({
		isRunningTest: false,
		modelResponses: [],
		resetState: resetStateMock,
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
	] as OpenAIPromptMessage[];

	let handleErrorMock: Mock;
	let setTemplateVariablesMock: Mock;

	beforeEach(() => {
		handleErrorMock = vi.fn();
		setTemplateVariablesMock = vi.fn();
	});

	it('should render the passed in messages', () => {
		render(
			<PromptConfigTestingForm
				applicationId={applicationId}
				projectId={projectId}
				modelType={modelType}
				modelVendor={modelVendor}
				templateVariables={templateVariables}
				parameters={parameters}
				messages={messages}
				projectCredits={'1.0'}
				handleError={handleErrorMock}
				handleRefreshProject={vi.fn()}
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
		] as OpenAIPromptMessage[];

		render(
			<PromptConfigTestingForm
				applicationId={applicationId}
				projectId={projectId}
				modelType={modelType}
				modelVendor={modelVendor}
				templateVariables={templateVariables}
				parameters={parameters}
				messages={messagesWithVariables}
				projectCredits={'1.0'}
				handleError={handleErrorMock}
				handleRefreshProject={vi.fn()}
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
			<PromptConfigTestingForm
				applicationId={applicationId}
				projectId={projectId}
				modelType={modelType}
				modelVendor={modelVendor}
				templateVariables={templateVariables}
				parameters={parameters}
				messages={messages}
				projectCredits={'1.0'}
				handleError={handleErrorMock}
				handleRefreshProject={vi.fn()}
				setTemplateVariables={setTemplateVariablesMock}
			/>,
		);
		expect(handleErrorMock).not.toHaveBeenCalled();

		mockHook.mock.calls.at(-1)?.[0].onError('test error');

		expect(handleErrorMock).toHaveBeenCalled();
	});

	it('does not allow executing the test if a template variable is missing', () => {
		const messagesWithVariables = [
			...messages,
			{
				content: '{userInput}',
				role: 'user',
				templateVariables: ['userInput'],
			},
		] as OpenAIPromptMessage[];

		render(
			<PromptConfigTestingForm
				applicationId={applicationId}
				projectId={projectId}
				modelType={modelType}
				modelVendor={modelVendor}
				templateVariables={templateVariables}
				parameters={parameters}
				messages={messagesWithVariables}
				projectCredits={'1.0'}
				handleError={handleErrorMock}
				handleRefreshProject={vi.fn()}
				setTemplateVariables={setTemplateVariablesMock}
			/>,
		);

		const runTestButton = screen.getByTestId('run-test-button');
		expect(runTestButton).toBeInTheDocument();

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
		] as OpenAIPromptMessage[];

		const { rerender } = render(
			<PromptConfigTestingForm
				applicationId={applicationId}
				projectId={projectId}
				modelType={modelType}
				modelVendor={modelVendor}
				templateVariables={{}}
				parameters={parameters}
				messages={messagesWithVariables}
				projectCredits={'1.0'}
				handleError={handleErrorMock}
				handleRefreshProject={vi.fn()}
				setTemplateVariables={setTemplateVariablesMock}
			/>,
		);

		const runTestButton = screen.getByTestId('run-test-button');
		expect(runTestButton).toBeInTheDocument();

		const templateVariableInput = screen.getByTestId(
			'input-variable-input-userInput',
		);
		expect(templateVariableInput).toBeInTheDocument();

		fireEvent.change(templateVariableInput, { target: { value: 'test' } });

		await waitFor(() => {
			expect(setTemplateVariablesMock).toHaveBeenCalled();
		});

		rerender(
			<PromptConfigTestingForm
				applicationId={applicationId}
				projectId={projectId}
				modelType={modelType}
				modelVendor={modelVendor}
				templateVariables={{ userInput: 'test' }}
				parameters={parameters}
				messages={messagesWithVariables}
				projectCredits={'1.0'}
				handleError={handleErrorMock}
				handleRefreshProject={vi.fn()}
				setTemplateVariables={setTemplateVariablesMock}
			/>,
		);

		await waitFor(() => {
			expect(runTestButton).toBeEnabled();
		});
	});

	it('runs the test and displays the results', async () => {
		const { rerender } = render(
			<PromptConfigTestingForm
				applicationId={applicationId}
				projectId={projectId}
				modelType={modelType}
				modelVendor={modelVendor}
				templateVariables={templateVariables}
				parameters={parameters}
				messages={messages}
				handleError={handleErrorMock}
				projectCredits={'1.0'}
				handleRefreshProject={vi.fn()}
				setTemplateVariables={setTemplateVariablesMock}
			/>,
		);

		const runTestButton = screen.getByTestId('run-test-button');
		expect(runTestButton).toBeInTheDocument();

		await waitFor(() => {
			expect(runTestButton).toBeEnabled();
		});

		fireEvent.click(runTestButton);

		expect(resetStateMock).toHaveBeenCalledTimes(1);
		expect(sendMessagesMock).toHaveBeenCalledTimes(1);
		expect(sendMessagesMock).toHaveBeenCalledWith({
			modelParameters: parameters,
			modelType,
			modelVendor,
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
			<PromptConfigTestingForm
				applicationId={applicationId}
				projectId={projectId}
				modelType={modelType}
				modelVendor={modelVendor}
				templateVariables={templateVariables}
				parameters={parameters}
				messages={messages}
				handleError={handleErrorMock as any}
				projectCredits={'1.0'}
				handleRefreshProject={vi.fn()}
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
			<PromptConfigTestingForm
				applicationId={applicationId}
				projectId={projectId}
				modelType={modelType}
				modelVendor={modelVendor}
				templateVariables={templateVariables}
				parameters={parameters}
				messages={messages}
				handleError={handleErrorMock}
				projectCredits={'1.0'}
				handleRefreshProject={vi.fn()}
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

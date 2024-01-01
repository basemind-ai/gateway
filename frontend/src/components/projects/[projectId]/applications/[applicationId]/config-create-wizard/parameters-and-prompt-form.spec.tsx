import en from 'public/messages/en.json';
import { fireEvent, render, screen, waitFor } from 'tests/test-utils';
import { expect } from 'vitest';

import {
	OpenAIModelParametersForm,
	OpenAIPromptTemplate,
} from '@/components/projects/[projectId]/applications/[applicationId]/config-create-wizard/openai-form-components';
import { PromptConfigParametersAndPromptForm } from '@/components/projects/[projectId]/applications/[applicationId]/config-create-wizard/parameters-and-prompt-form';
import {
	DEFAULT_MAX_TOKENS,
	openAIModelsMaxTokensMap,
} from '@/constants/models';
import { ModelVendor, OpenAIModelType, OpenAIPromptMessageRole } from '@/types';

describe('parameters-and-prompt-form components tests', () => {
	const namespace: Record<string, string> = en.createConfigWizard;

	describe('PromptConfigParametersAndPromptForm', () => {
		it('should render two components without errors or warnings', () => {
			render(
				<PromptConfigParametersAndPromptForm
					modelType={OpenAIModelType.Gpt35Turbo}
					modelVendor={ModelVendor.OpenAI}
					setParameters={vi.fn()}
					setMessages={vi.fn()}
				/>,
			);

			expect(
				screen.getByTestId('openai-model-parameters-form'),
			).toBeInTheDocument();
			expect(
				screen.getByTestId('openai-prompt-template-form'),
			).toBeInTheDocument();
		});

		it('should update the model parameters state when the user changes the input values in OpenAIModelParametersForm', () => {
			const setParameters = vi.fn();

			render(
				<PromptConfigParametersAndPromptForm
					modelType={OpenAIModelType.Gpt35Turbo}
					modelVendor={ModelVendor.OpenAI}
					setParameters={setParameters}
					setMessages={vi.fn()}
				/>,
			);

			const maxTokensInput = screen.getByTestId(
				'parameter-slider-maxTokens',
			);
			const frequencyPenaltyInput = screen.getByTestId(
				'parameter-slider-frequencyPenalty',
			);

			fireEvent.change(maxTokensInput, { target: { value: '200' } });
			fireEvent.change(frequencyPenaltyInput, {
				target: { value: '0.8' },
			});
			expect(setParameters).toHaveBeenCalledTimes(3);
		});
	});

	describe('OpenAIModelParametersForm', () => {
		it('should render all input fields with their respective labels and tooltips', () => {
			render(
				<OpenAIModelParametersForm
					modelType={OpenAIModelType.Gpt35Turbo}
					setParameters={vi.fn()}
				/>,
			);

			const maxTokensLabel = screen.getByText(
				namespace.openaiParametersMaxTokensLabel,
			);
			const frequencyPenaltyLabel = screen.getByText(
				namespace.openaiParametersFrequencyPenaltyLabel,
			);
			const presencePenaltyLabel = screen.getByText(
				namespace.openaiParametersPresencePenaltyLabel,
			);
			const temperatureLabel = screen.getByText(
				namespace.openaiParametersTemperatureLabel,
			);
			const topPLabel = screen.getByText(
				namespace.openaiParametersTopPLabel,
			);

			expect(maxTokensLabel).toBeInTheDocument();
			expect(frequencyPenaltyLabel).toBeInTheDocument();
			expect(presencePenaltyLabel).toBeInTheDocument();
			expect(temperatureLabel).toBeInTheDocument();
			expect(topPLabel).toBeInTheDocument();

			const maxTokensTooltip = screen.getByTestId('maxTokens-tooltip');
			const frequencyPenaltyTooltip = screen.getByTestId(
				'frequencyPenalty-tooltip',
			);
			const presencePenaltyTooltip = screen.getByTestId(
				'presencePenalty-tooltip',
			);
			const temperatureTooltip = screen.getByTestId(
				'temperature-tooltip',
			);
			const topPTooltip = screen.getByTestId('topP-tooltip');

			expect(maxTokensTooltip).toBeInTheDocument();
			expect(frequencyPenaltyTooltip).toBeInTheDocument();
			expect(presencePenaltyTooltip).toBeInTheDocument();
			expect(temperatureTooltip).toBeInTheDocument();
			expect(topPTooltip).toBeInTheDocument();
		});

		it('should display the default values for each input field if no existing parameters are provided', () => {
			render(
				<OpenAIModelParametersForm
					modelType={OpenAIModelType.Gpt35Turbo}
					setParameters={vi.fn()}
				/>,
			);

			const maxTokensInput = screen.getByTestId(
				'parameter-slider-maxTokens',
			);
			const frequencyPenaltyInput = screen.getByTestId(
				'parameter-slider-frequencyPenalty',
			);
			const presencePenaltyInput = screen.getByTestId(
				'parameter-slider-presencePenalty',
			);
			const temperatureInput = screen.getByTestId(
				'parameter-slider-temperature',
			);
			const topPInput = screen.getByTestId('parameter-slider-topP');

			expect(maxTokensInput).toHaveValue(DEFAULT_MAX_TOKENS.toString());
			expect(frequencyPenaltyInput).toHaveValue('0');
			expect(presencePenaltyInput).toHaveValue('0');
			expect(temperatureInput).toHaveValue('0');
			expect(topPInput).toHaveValue('0');
		});

		it('should update the parameters state with the correct values when any input field is changed', () => {
			const setParameters = vi.fn();
			render(
				<OpenAIModelParametersForm
					modelType={OpenAIModelType.Gpt35Turbo}
					setParameters={setParameters}
				/>,
			);

			const maxTokensInput = screen.getByTestId(
				'parameter-slider-maxTokens',
			);
			const frequencyPenaltyInput = screen.getByTestId(
				'parameter-slider-frequencyPenalty',
			);
			const presencePenaltyInput = screen.getByTestId(
				'parameter-slider-presencePenalty',
			);
			const temperatureInput = screen.getByTestId(
				'parameter-slider-temperature',
			);
			const topPInput = screen.getByTestId('parameter-slider-topP');

			fireEvent.change(maxTokensInput, { target: { value: 100 } });
			fireEvent.change(frequencyPenaltyInput, { target: { value: 0.5 } });
			fireEvent.change(presencePenaltyInput, { target: { value: 0.3 } });
			fireEvent.change(temperatureInput, { target: { value: 0.8 } });
			fireEvent.change(topPInput, { target: { value: 0.9 } });

			expect(setParameters).toHaveBeenCalledWith({
				frequencyPenalty: 0.5,
				maxTokens: 100,
				presencePenalty: 0.3,
				temperature: 0.8,
				topP: 0.9,
			});
		});

		it('should display the correct tooltip text when hovering over the info icon', () => {
			render(
				<OpenAIModelParametersForm
					modelType={OpenAIModelType.Gpt35Turbo}
					setParameters={vi.fn()}
				/>,
			);

			const maxTokensTooltip = screen.getByTestId('maxTokens-tooltip');
			const frequencyPenaltyTooltip = screen.getByTestId(
				'frequencyPenalty-tooltip',
			);
			const presencePenaltyTooltip = screen.getByTestId(
				'presencePenalty-tooltip',
			);
			const temperatureTooltip = screen.getByTestId(
				'temperature-tooltip',
			);
			const topPTooltip = screen.getByTestId('topP-tooltip');

			expect(maxTokensTooltip).toHaveAttribute(
				'data-tip',
				namespace.openaiParametersMaxTokensTooltip,
			);
			expect(frequencyPenaltyTooltip).toHaveAttribute(
				'data-tip',
				namespace.openaiParametersFrequencyPenaltyTooltip,
			);
			expect(presencePenaltyTooltip).toHaveAttribute(
				'data-tip',
				namespace.openaiParametersPresencePenaltyTooltip,
			);
			expect(temperatureTooltip).toHaveAttribute(
				'data-tip',
				namespace.openaiParametersTemperatureTooltip,
			);
			expect(topPTooltip).toHaveAttribute(
				'data-tip',
				namespace.openaiParametersTopPTooltip,
			);
		});

		it('should format the value of each input field correctly', () => {
			render(
				<OpenAIModelParametersForm
					modelType={OpenAIModelType.Gpt35Turbo}
					setParameters={vi.fn()}
				/>,
			);

			const maxTokensLabel = screen.getByText(
				namespace.openaiParametersMaxTokensLabel,
			);
			const frequencyPenaltyLabel = screen.getByText(
				namespace.openaiParametersFrequencyPenaltyLabel,
			);
			const presencePenaltyLabel = screen.getByText(
				namespace.openaiParametersPresencePenaltyLabel,
			);
			const temperatureLabel = screen.getByText(
				namespace.openaiParametersTemperatureLabel,
			);
			const topPLabel = screen.getByText(
				namespace.openaiParametersTopPLabel,
			);

			expect(maxTokensLabel).toHaveTextContent(
				namespace.openaiParametersMaxTokensLabel,
			);
			expect(frequencyPenaltyLabel).toHaveTextContent(
				namespace.openaiParametersFrequencyPenaltyLabel,
			);
			expect(presencePenaltyLabel).toHaveTextContent(
				namespace.openaiParametersPresencePenaltyLabel,
			);
			expect(temperatureLabel).toHaveTextContent(
				namespace.openaiParametersTemperatureLabel,
			);
			expect(topPLabel).toHaveTextContent(
				namespace.openaiParametersTopPLabel,
			);
		});

		it('should render a range input for each parameter with the correct min, max, and step values', () => {
			render(
				<OpenAIModelParametersForm
					modelType={OpenAIModelType.Gpt35Turbo}
					setParameters={vi.fn()}
				/>,
			);

			const maxTokensInput = screen.getByTestId(
				'parameter-slider-maxTokens',
			);
			const frequencyPenaltyInput = screen.getByTestId(
				'parameter-slider-frequencyPenalty',
			);
			const presencePenaltyInput = screen.getByTestId(
				'parameter-slider-presencePenalty',
			);
			const temperatureInput = screen.getByTestId(
				'parameter-slider-temperature',
			);
			const topPInput = screen.getByTestId('parameter-slider-topP');

			expect(maxTokensInput).toHaveAttribute('min', '1');
			expect(maxTokensInput).toHaveAttribute(
				'max',
				openAIModelsMaxTokensMap[OpenAIModelType.Gpt35Turbo].toString(),
			);
			expect(maxTokensInput).toHaveAttribute('step', '1');

			expect(frequencyPenaltyInput).toHaveAttribute('min', '0');
			expect(frequencyPenaltyInput).toHaveAttribute('max', '2');
			expect(frequencyPenaltyInput).toHaveAttribute('step', '0.1');

			expect(presencePenaltyInput).toHaveAttribute('min', '0');
			expect(presencePenaltyInput).toHaveAttribute('max', '2');
			expect(presencePenaltyInput).toHaveAttribute('step', '0.1');

			expect(temperatureInput).toHaveAttribute('min', '0');
			expect(temperatureInput).toHaveAttribute('max', '2');
			expect(temperatureInput).toHaveAttribute('step', '0.1');

			expect(topPInput).toHaveAttribute('min', '0');
			expect(topPInput).toHaveAttribute('max', '1');
			expect(topPInput).toHaveAttribute('step', '0.1');
		});

		it('should handle existing parameters object with missing properties', () => {
			const existingParameters = {
				frequencyPenalty: 0.5,
				maxTokens: 100,
				presencePenalty: 0.3,
				temperature: 0.8,
				topP: 0.9,
			};
			render(
				<OpenAIModelParametersForm
					modelType={OpenAIModelType.Gpt35Turbo}
					setParameters={vi.fn()}
					existingParameters={existingParameters}
				/>,
			);

			const maxTokensInput = screen.getByTestId(
				'parameter-slider-maxTokens',
			);
			const frequencyPenaltyInput = screen.getByTestId(
				'parameter-slider-frequencyPenalty',
			);
			const presencePenaltyInput = screen.getByTestId(
				'parameter-slider-presencePenalty',
			);
			const temperatureInput = screen.getByTestId(
				'parameter-slider-temperature',
			);
			const topPInput = screen.getByTestId('parameter-slider-topP');

			expect(maxTokensInput).toHaveValue(
				existingParameters.maxTokens.toString(),
			);
			expect(frequencyPenaltyInput).toHaveValue(
				existingParameters.frequencyPenalty.toString(),
			);
			expect(presencePenaltyInput).toHaveValue(
				existingParameters.presencePenalty.toString(),
			);
			expect(temperatureInput).toHaveValue(
				existingParameters.temperature.toString(),
			);
			expect(topPInput).toHaveValue(existingParameters.topP.toString());
		});

		it('should handle existing parameters object with undefined properties', () => {
			const existingParameters = {
				frequencyPenalty: undefined,
				maxTokens: undefined,
				presencePenalty: undefined,
				temperature: undefined,
				topP: undefined,
			};
			render(
				<OpenAIModelParametersForm
					modelType={OpenAIModelType.Gpt35Turbo}
					setParameters={vi.fn()}
					existingParameters={existingParameters}
				/>,
			);

			const maxTokensInput = screen.getByTestId(
				'parameter-slider-maxTokens',
			);
			const frequencyPenaltyInput = screen.getByTestId(
				'parameter-slider-frequencyPenalty',
			);
			const presencePenaltyInput = screen.getByTestId(
				'parameter-slider-presencePenalty',
			);
			const temperatureInput = screen.getByTestId(
				'parameter-slider-temperature',
			);
			const topPInput = screen.getByTestId('parameter-slider-topP');

			expect(maxTokensInput).toHaveValue(DEFAULT_MAX_TOKENS.toString());
			expect(frequencyPenaltyInput).toHaveValue('0');
			expect(presencePenaltyInput).toHaveValue('0');
			expect(temperatureInput).toHaveValue('0');
			expect(topPInput).toHaveValue('0');
		});
	});

	describe('OpenAIPromptTemplate', () => {
		it('should render the prompt template form with the correct initial state and props', () => {
			const setMessages = vi.fn();

			render(
				<OpenAIPromptTemplate
					messages={[]}
					setMessages={setMessages}
				/>,
			);

			expect(
				screen.getByTestId('openai-prompt-template-form'),
			).toBeInTheDocument();
			expect(
				screen.getByTestId('parameters-and-prompt-form-new-message'),
			).toBeInTheDocument();
			expect(
				screen.getByTestId(
					'parameters-and-prompt-form-new-message-role-label',
				),
			).toHaveTextContent('Role');
			expect(
				screen.getByTestId(
					'parameters-and-prompt-form-new-message-name-label',
				),
			).toHaveTextContent('Name');
			expect(
				screen.getByTestId(
					'parameters-and-prompt-form-new-message-content-label',
				),
			).toHaveTextContent('Content');
			expect(
				screen.getByTestId(
					'parameters-and-prompt-form-message-role-select',
				),
			).toHaveValue(OpenAIPromptMessageRole.System);
			expect(
				screen.getByTestId(
					'parameters-and-prompt-form-message-name-input',
				),
			).toHaveValue('');
			expect(
				screen.getByTestId(
					'parameters-and-prompt-form-message-textarea',
				),
			).toHaveValue('');
			expect(
				screen.getByTestId(
					'parameters-and-prompt-form-save-message-button',
				),
			).toBeDisabled();
		});

		it('should allow the user to select an existing message or create a new one', () => {
			const messages = [
				{ content: 'Message 1', role: OpenAIPromptMessageRole.System },
				{ content: 'Message 2', role: OpenAIPromptMessageRole.User },
			];
			const setMessages = vi.fn();

			render(
				<OpenAIPromptTemplate
					messages={messages}
					setMessages={setMessages}
				/>,
			);

			const message1RadioInput = screen.getByTestId(
				'parameters-and-prompt-form-message-0',
			);
			const message2RadioInput = screen.getByTestId(
				'parameters-and-prompt-form-message-1',
			);
			const newMessageRadioInput = screen.getByTestId(
				'parameters-and-prompt-form-new-message',
			);

			expect(message1RadioInput).toBeInTheDocument();
			expect(message2RadioInput).toBeInTheDocument();
			expect(newMessageRadioInput).toBeInTheDocument();
		});

		it('should update the active message and draft message when a message is clicked', async () => {
			const messages = [
				{ content: 'Message 1', role: OpenAIPromptMessageRole.System },
				{ content: 'Message 2', role: OpenAIPromptMessageRole.User },
			];
			const setMessages = vi.fn();

			render(
				<OpenAIPromptTemplate
					messages={messages}
					setMessages={setMessages}
				/>,
			);

			const newMessageButton: HTMLButtonElement = screen.getByTestId(
				'parameters-and-prompt-form-new-message',
			);

			fireEvent.click(newMessageButton);

			await waitFor(() => {
				expect(newMessageButton).toHaveClass('btn-secondary');
			});
		});

		it('should update the draft message when the user changes the role, name, or content', () => {
			const messages = [
				{ content: 'Message 1', role: OpenAIPromptMessageRole.System },
				{ content: 'Message 2', role: OpenAIPromptMessageRole.User },
			];
			const setMessages = vi.fn();

			render(
				<OpenAIPromptTemplate
					messages={messages}
					setMessages={setMessages}
				/>,
			);

			const roleSelect = screen.getByTestId(
				'parameters-and-prompt-form-message-role-select',
			);
			const nameInput = screen.getByTestId(
				'parameters-and-prompt-form-message-name-input',
			);
			const contentTextarea = screen.getByTestId(
				'parameters-and-prompt-form-message-textarea',
			);

			fireEvent.change(roleSelect, {
				target: { value: OpenAIPromptMessageRole.User },
			});
			fireEvent.change(nameInput, { target: { value: 'New Name' } });
			fireEvent.change(contentTextarea, {
				target: { value: 'New Content' },
			});

			expect(roleSelect).toHaveValue(OpenAIPromptMessageRole.User);
			expect(nameInput).toHaveValue('New Name');
			expect(contentTextarea).toHaveValue('New Content');
		});

		it('should save the draft message and add it to the list of messages when the save button is clicked', () => {
			const messages = [
				{ content: 'Message 1', role: OpenAIPromptMessageRole.System },
				{ content: 'Message 2', role: OpenAIPromptMessageRole.User },
			];
			const setMessages = vi.fn();

			render(
				<OpenAIPromptTemplate
					messages={messages}
					setMessages={setMessages}
				/>,
			);

			const contentTextarea = screen.getByTestId(
				'parameters-and-prompt-form-message-textarea',
			);

			fireEvent.change(contentTextarea, {
				target: { value: 'New Content' },
			});

			const saveButton = screen.getByTestId(
				'parameters-and-prompt-form-save-message-button',
			);

			fireEvent.click(saveButton);

			expect(setMessages).toHaveBeenCalled();
		});

		it('should delete the active message and update the list of messages when the delete button is clicked', () => {
			const messages = [
				{ content: 'Message 1', role: OpenAIPromptMessageRole.System },
				{ content: 'Message 2', role: OpenAIPromptMessageRole.User },
			];
			const setMessages = vi.fn();

			render(
				<OpenAIPromptTemplate
					messages={messages}
					setMessages={setMessages}
				/>,
			);

			const deleteButton = screen.getByTestId(
				'parameters-and-prompt-form-delete-message-button',
			);

			fireEvent.click(deleteButton);

			expect(setMessages).toHaveBeenCalled();
		});

		it('should handle empty or invalid input values for the message content and name fields', () => {
			const messages = [
				{ content: 'Message 1', role: OpenAIPromptMessageRole.System },
				{ content: 'Message 2', role: OpenAIPromptMessageRole.User },
			];
			const setMessages = vi.fn();

			render(
				<OpenAIPromptTemplate
					messages={messages}
					setMessages={setMessages}
				/>,
			);

			const saveButton = screen.getByTestId(
				'parameters-and-prompt-form-save-message-button',
			);

			fireEvent.click(saveButton);

			expect(setMessages).not.toHaveBeenCalled();
		});

		it('should handle errors or unexpected input values when updating or saving messages', () => {
			const messages = [
				{ content: 'Message 1', role: OpenAIPromptMessageRole.System },
				{ content: 'Message 2', role: OpenAIPromptMessageRole.User },
			];
			const setMessages = vi.fn();

			render(
				<OpenAIPromptTemplate
					messages={messages}
					setMessages={setMessages}
				/>,
			);

			const saveButton = screen.getByTestId(
				'parameters-and-prompt-form-save-message-button',
			);

			fireEvent.click(saveButton);

			expect(setMessages).not.toHaveBeenCalled();
		});

		it('should handle edge cases related to the use of template variables in the message content', () => {
			const messages = [
				{ content: 'Message 1', role: OpenAIPromptMessageRole.System },
				{ content: 'Message 2', role: OpenAIPromptMessageRole.User },
			];
			const setMessages = vi.fn();

			render(
				<OpenAIPromptTemplate
					messages={messages}
					setMessages={setMessages}
				/>,
			);

			const saveButton = screen.getByTestId(
				'parameters-and-prompt-form-save-message-button',
			);

			fireEvent.click(saveButton);

			expect(setMessages).not.toHaveBeenCalled();
		});

		it('should handle edge cases related to the use of translations and internationalization', () => {
			const messages = [
				{ content: 'Message 1', role: OpenAIPromptMessageRole.System },
				{ content: 'Message 2', role: OpenAIPromptMessageRole.User },
			];
			const setMessages = vi.fn();

			render(
				<OpenAIPromptTemplate
					messages={messages}
					setMessages={setMessages}
				/>,
			);

			const saveButton = screen.getByTestId(
				'parameters-and-prompt-form-save-message-button',
			);

			fireEvent.click(saveButton);

			expect(setMessages).not.toHaveBeenCalled();
		});
	});
});

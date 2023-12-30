import { CoherePromptParametersFactory } from 'tests/factories';
import {
	fireEvent,
	getLocaleNamespace,
	render,
	screen,
} from 'tests/test-utils';

import {
	CohereModelParametersForm,
	CoherePromptTemplate,
} from '@/components/projects/[projectId]/applications/[applicationId]/config-create-wizard/cohere-form-components';
import { CohereModelParameters, CohereModelType } from '@/types';

describe('Cohere Form Components', () => {
	const locales = getLocaleNamespace('createConfigWizard');

	describe('CohereModelParametersForm Tests', () => {
		it('should render the component and all sliders using the provided existing parameters as initial values', () => {
			const exitingParameters =
				CoherePromptParametersFactory.buildSync() as Required<CohereModelParameters>;

			render(
				<CohereModelParametersForm
					existingParameters={exitingParameters}
					modelType={CohereModelType.Command}
					setParameters={vi.fn()}
				/>,
			);

			const maxTokensSliderInput: HTMLInputElement = screen.getByTestId(
				'parameter-slider-maxTokens',
			);
			expect(maxTokensSliderInput.value).toBe(
				exitingParameters.maxTokens.toString(),
			);

			const temperatureSliderInput: HTMLInputElement = screen.getByTestId(
				'parameter-slider-temperature',
			);
			expect(temperatureSliderInput.value).toBe(
				exitingParameters.temperature.toString(),
			);

			const pSliderInput: HTMLInputElement =
				screen.getByTestId('parameter-slider-p');
			expect(pSliderInput.value).toBe(exitingParameters.p.toString());

			const kSliderInput: HTMLInputElement =
				screen.getByTestId('parameter-slider-k');
			expect(kSliderInput.value).toBe(exitingParameters.k.toString());

			const frequencyPenaltySliderInput: HTMLInputElement =
				screen.getByTestId('parameter-slider-frequencyPenalty');
			expect(frequencyPenaltySliderInput.value).toBe(
				exitingParameters.frequencyPenalty.toString(),
			);

			const presencePenaltySliderInput: HTMLInputElement =
				screen.getByTestId('parameter-slider-presencePenalty');
			expect(presencePenaltySliderInput.value).toBe(
				exitingParameters.presencePenalty.toString(),
			);
		});

		it('should update the value of the slider when it is adjusted by the user', () => {
			const exitingParameters =
				CoherePromptParametersFactory.buildSync() as Required<CohereModelParameters>;

			render(
				<CohereModelParametersForm
					existingParameters={exitingParameters}
					modelType={CohereModelType.Command}
					setParameters={vi.fn()}
				/>,
			);

			const maxTokensSliderInput: HTMLInputElement = screen.getByTestId(
				'parameter-slider-maxTokens',
			);

			fireEvent.change(maxTokensSliderInput, { target: { value: '50' } });

			expect(maxTokensSliderInput.value).toBe('50');
		});

		it('should update the model parameters correctly when the slider is adjusted', () => {
			const exitingParameters =
				CoherePromptParametersFactory.buildSync() as Required<CohereModelParameters>;

			const setParametersMock = vi.fn();

			render(
				<CohereModelParametersForm
					existingParameters={exitingParameters}
					modelType={CohereModelType.Command}
					setParameters={setParametersMock}
				/>,
			);

			const maxTokensSliderInput: HTMLInputElement = screen.getByTestId(
				'parameter-slider-maxTokens',
			);

			fireEvent.change(maxTokensSliderInput, { target: { value: '50' } });

			expect(setParametersMock).toHaveBeenCalledWith({
				...exitingParameters,
				maxTokens: 50,
			});
		});
	});

	describe('CoherePromptTemplate tests', () => {
		it('should render the form with the correct header and label text', () => {
			const setMessages = vi.fn();

			render(
				<CoherePromptTemplate
					messages={[]}
					setMessages={setMessages}
				/>,
			);

			expect(
				screen.getByTestId('cohere-prompt-template-form-header'),
			).toHaveTextContent(locales.promptTemplate);
			expect(
				screen.getByTestId('cohere-prompt-template-form-label-text'),
			).toHaveTextContent(locales.messageContent);
		});

		it('should display the message content textarea with the correct placeholder text', () => {
			const setMessages = vi.fn();

			render(
				<CoherePromptTemplate
					messages={[]}
					setMessages={setMessages}
				/>,
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
				<CoherePromptTemplate
					messages={[]}
					setMessages={setMessages}
				/>,
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
				<CoherePromptTemplate
					messages={[]}
					setMessages={setMessages}
				/>,
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
				<CoherePromptTemplate
					messages={[]}
					setMessages={setMessages}
				/>,
			);

			expect(
				screen.getByTestId('cohere-prompt-template-form-textarea'),
			).toHaveValue('');
		});

		it('should render the form with empty message content when messages array is empty', () => {
			const setMessages = vi.fn();

			render(
				<CoherePromptTemplate
					messages={[]}
					setMessages={setMessages}
				/>,
			);

			expect(
				screen.getByTestId('cohere-prompt-template-form-textarea'),
			).toHaveValue('');
		});

		it('should display a text info label with wrap variable instructions', () => {
			const setMessages = vi.fn();

			render(
				<CoherePromptTemplate
					messages={[]}
					setMessages={setMessages}
				/>,
			);

			expect(
				screen.getByTestId(
					'cohere-prompt-template-form-label-alt-text',
				),
			).toHaveTextContent(locales.wrapVariable.replaceAll("'", ''));
		});
	});
});

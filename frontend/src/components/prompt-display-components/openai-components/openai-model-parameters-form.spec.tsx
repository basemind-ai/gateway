import { OpenAIPromptParametersFactory } from 'tests/factories';
import { fireEvent, render, screen } from 'tests/test-utils';

import { OpenAIModelParametersForm } from '@/components/prompt-display-components/openai-components/openai-model-parameters-form';
import { OpenAIModelParameters, OpenAIModelType } from '@/types';

describe('OpenAIModelParametersForm Tests', () => {
	it('should render the component and all sliders using the provided existing parameters as initial values', () => {
		const exitingParameters =
			OpenAIPromptParametersFactory.buildSync() as Required<OpenAIModelParameters>;

		render(
			<OpenAIModelParametersForm
				existingParameters={exitingParameters}
				modelType={OpenAIModelType.Gpt35Turbo}
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

		const pSliderInput: HTMLInputElement = screen.getByTestId(
			'parameter-slider-topP',
		);
		expect(pSliderInput.value).toBe(exitingParameters.topP.toString());

		const frequencyPenaltySliderInput: HTMLInputElement =
			screen.getByTestId('parameter-slider-frequencyPenalty');

		expect(frequencyPenaltySliderInput.value).toBe(
			exitingParameters.frequencyPenalty.toString(),
		);

		const presencePenaltySliderInput: HTMLInputElement = screen.getByTestId(
			'parameter-slider-presencePenalty',
		);
		expect(presencePenaltySliderInput.value).toBe(
			exitingParameters.presencePenalty.toString(),
		);
	});

	it('should update the value of the slider when it is adjusted by the user', () => {
		const exitingParameters =
			OpenAIPromptParametersFactory.buildSync() as Required<OpenAIModelParameters>;

		render(
			<OpenAIModelParametersForm
				existingParameters={exitingParameters}
				modelType={OpenAIModelType.Gpt35Turbo}
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
			OpenAIPromptParametersFactory.buildSync() as Required<OpenAIModelParameters>;

		const setParametersMock = vi.fn();

		render(
			<OpenAIModelParametersForm
				existingParameters={exitingParameters}
				modelType={OpenAIModelType.Gpt35Turbo}
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

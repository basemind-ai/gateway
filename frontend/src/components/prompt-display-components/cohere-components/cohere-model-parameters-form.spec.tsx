import { CoherePromptParametersFactory } from 'tests/factories';
import { fireEvent, render, screen } from 'tests/test-utils';

import { CohereModelParametersForm } from '@/components/prompt-display-components/cohere-components/cohere-model-parameters-form';
import { CohereModelParameters, CohereModelType } from '@/types';

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

		const presencePenaltySliderInput: HTMLInputElement = screen.getByTestId(
			'parameter-slider-presencePenalty',
		);
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

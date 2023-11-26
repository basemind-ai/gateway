import { fireEvent } from '@testing-library/react';
import { render, screen } from 'tests/test-utils';

import { PromptTestInputs } from '@/components/prompt-display-components/prompt-test-inputs';

describe('PromptTestInputs', () => {
	it('should render the correct number of input fields', () => {
		const expectedVariables = ['variable1', 'variable2', 'variable3'];
		const templateVariables = {
			variable1: 'value1',
			variable2: 'value2',
			variable3: 'value3',
		};
		const setTemplateVariables = vi.fn();

		render(
			<PromptTestInputs
				expectedVariables={expectedVariables}
				templateVariables={templateVariables}
				setTemplateVariables={setTemplateVariables}
			/>,
		);

		const inputFields = screen.getAllByTestId(/input-variable-input-.*/);
		expect(inputFields.length).toBe(expectedVariables.length);
	});

	it('should display the expected variable names as placeholders', () => {
		const expectedVariables = ['variable1', 'variable2', 'variable3'];
		const templateVariables = {
			variable1: 'value1',
			variable2: 'value2',
			variable3: 'value3',
		};
		const setTemplateVariables = vi.fn();

		render(
			<PromptTestInputs
				expectedVariables={expectedVariables}
				templateVariables={templateVariables}
				setTemplateVariables={setTemplateVariables}
			/>,
		);

		const inputFields = screen.getAllByTestId(/input-variable-input-.*/);
		inputFields.forEach((inputField, index) => {
			expect(inputField).toHaveAttribute(
				'placeholder',
				`{${expectedVariables[index]}}`,
			);
		});
	});

	it('should update the templateVariables state when input values change', () => {
		const expectedVariables = ['variable1', 'variable2', 'variable3'];
		const templateVariables = {
			variable1: 'value1',
			variable2: 'value2',
			variable3: 'value3',
		};
		const setTemplateVariables = vi.fn();

		render(
			<PromptTestInputs
				expectedVariables={expectedVariables}
				templateVariables={templateVariables}
				setTemplateVariables={setTemplateVariables}
			/>,
		);

		const inputFields = screen.getAllByTestId(/input-variable-input-.*/);

		fireEvent.change(inputFields[0], { target: { value: 'new value' } });

		expect(setTemplateVariables).toHaveBeenCalledWith({
			...templateVariables,
			variable1: 'new value',
		});
	});

	it('should not render any input fields when expectedVariables prop is an empty array', () => {
		const templateVariables = {
			variable1: 'value1',
			variable2: 'value2',
			variable3: 'value3',
		};
		const setTemplateVariables = vi.fn();

		render(
			<PromptTestInputs
				expectedVariables={[]}
				templateVariables={templateVariables}
				setTemplateVariables={setTemplateVariables}
			/>,
		);

		const inputFields = screen.queryAllByTestId(/input-variable-input-.*/);
		expect(inputFields.length).toBe(0);
	});

	it('should render the correct number of input fields when expectedVariables prop contains duplicate values', () => {
		const expectedVariables = ['variable1', 'variable1', 'variable2'];
		const templateVariables = {
			variable1: 'value1',
			variable2: 'value2',
			variable3: 'value3',
		};
		const setTemplateVariables = vi.fn();

		render(
			<PromptTestInputs
				expectedVariables={expectedVariables}
				templateVariables={templateVariables}
				setTemplateVariables={setTemplateVariables}
			/>,
		);

		const inputFields = screen.getAllByTestId(/input-variable-input-.*/);
		expect(inputFields.length).toBe(expectedVariables.length);
	});

	it('should render the correct number of input fields when templateVariables prop is an empty object', () => {
		const expectedVariables = ['variable1', 'variable2', 'variable3'];
		const templateVariables = {};
		const setTemplateVariables = vi.fn();

		render(
			<PromptTestInputs
				expectedVariables={expectedVariables}
				templateVariables={templateVariables}
				setTemplateVariables={setTemplateVariables}
			/>,
		);

		const inputFields = screen.getAllByTestId(/input-variable-input-.*/);
		expect(inputFields.length).toBe(expectedVariables.length);
	});
});

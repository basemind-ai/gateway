import { waitFor } from '@testing-library/react';
import { fireEvent, render, screen } from 'tests/test-utils';

import { PromptConfigBaseForm } from '@/components/projects/[projectId]/applications/[applicationId]/config-create-wizard/base-form';
import { ModelType, ModelVendor, OpenAIModelType } from '@/types';

describe('PromptConfigBaseForm', () => {
	it('should render the component without errors', () => {
		render(
			<PromptConfigBaseForm
				configName=""
				modelType={{} as ModelType<any>}
				modelVendor={ModelVendor.OpenAI}
				setConfigName={vi.fn()}
				setModelType={vi.fn()}
				setVendor={vi.fn()}
				nameIsInvalid={false}
			/>,
		);
		expect(
			screen.getByTestId('create-prompt-base-form-name-input'),
		).toBeInTheDocument();
		expect(
			screen.getByTestId('create-prompt-base-form-vendor-select'),
		).toBeInTheDocument();
		expect(
			screen.getByTestId('create-prompt-base-form-model-select'),
		).toBeInTheDocument();
	});

	it('should display an error message if the name is invalid', async () => {
		render(
			<PromptConfigBaseForm
				configName=""
				modelType={{} as ModelType<any>}
				modelVendor={ModelVendor.OpenAI}
				setConfigName={vi.fn()}
				setModelType={vi.fn()}
				setVendor={vi.fn()}
				nameIsInvalid={true}
			/>,
		);
		expect(
			screen.getByTestId('create-prompt-base-form-name-input'),
		).toBeInTheDocument();
		expect(
			screen.getByTestId('create-prompt-base-form-vendor-select'),
		).toBeInTheDocument();
		expect(
			screen.getByTestId('create-prompt-base-form-model-select'),
		).toBeInTheDocument();
		await waitFor(() => {
			expect(
				screen.getByTestId('invalid-name-error-message'),
			).toBeInTheDocument();
		});
	});

	it('should display and allow editing of the config name input field', () => {
		const configName = 'Test Config';
		const setConfigName = vi.fn();
		render(
			<PromptConfigBaseForm
				configName={configName}
				modelType={{} as ModelType<any>}
				modelVendor={ModelVendor.OpenAI}
				setConfigName={setConfigName}
				setModelType={vi.fn()}
				setVendor={vi.fn()}
				nameIsInvalid={false}
			/>,
		);
		const input: HTMLInputElement = screen.getByTestId(
			'create-prompt-base-form-name-input',
		);
		expect(input).toBeInTheDocument();
		expect(input.value).toBe(configName);
		fireEvent.change(input, { target: { value: 'New Config' } });
		expect(setConfigName).toHaveBeenCalledWith('New Config');
	});

	it('should display the model vendor select field as disabled', () => {
		const modelVendor = ModelVendor.OpenAI;
		render(
			<PromptConfigBaseForm
				configName=""
				modelType={{} as ModelType<any>}
				modelVendor={modelVendor}
				setConfigName={vi.fn()}
				setModelType={vi.fn()}
				setVendor={vi.fn()}
				nameIsInvalid={false}
			/>,
		);
		const select: HTMLInputElement = screen.getByTestId(
			'create-prompt-base-form-vendor-select',
		);
		expect(select).toBeInTheDocument();
		expect(select.value).toBe(modelVendor);
		expect(select.disabled).toBe(true);
	});

	it('should display and allow editing of the model type select field based on the selected model vendor', () => {
		const modelVendor = ModelVendor.OpenAI;
		const modelType = OpenAIModelType.Gpt35Turbo;
		const setModelType = vi.fn();
		render(
			<PromptConfigBaseForm
				configName=""
				modelType={modelType}
				modelVendor={modelVendor}
				setConfigName={vi.fn()}
				setModelType={setModelType}
				setVendor={vi.fn()}
				nameIsInvalid={false}
			/>,
		);
		const select: HTMLInputElement = screen.getByTestId(
			'create-prompt-base-form-model-select',
		);
		expect(select).toBeInTheDocument();
		expect(select.value).toBe(modelType);
		fireEvent.change(select, { target: { value: OpenAIModelType.Gpt4 } });
		expect(setModelType).toHaveBeenCalledWith(OpenAIModelType.Gpt4);
	});
});

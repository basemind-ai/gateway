import { faker } from '@faker-js/faker';
import { OpenAIPromptConfigFactory } from 'tests/factories';
import {
	fireEvent,
	render,
	renderHook,
	screen,
	waitFor,
} from 'tests/test-utils';

import { PromptConfigBaseForm } from '@/components/projects/[projectId]/applications/[applicationId]/config-create-wizard/base-form';
import { useSetPromptConfigs } from '@/stores/api-store';
import { ModelType, ModelVendor, OpenAIModelType } from '@/types';

describe('PromptConfigBaseForm', () => {
	const applicationId = faker.string.uuid();

	it('should render the component without errors', () => {
		render(
			<PromptConfigBaseForm
				configName=""
				validateConfigName={vi.fn()}
				modelType={{} as ModelType<any>}
				modelVendor={ModelVendor.OpenAI}
				setConfigName={vi.fn()}
				setModelType={vi.fn()}
				setVendor={vi.fn()}
				setIsValid={vi.fn()}
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
		const promptConfigs = OpenAIPromptConfigFactory.batchSync(2);

		const {
			result: { current: setPromptConfigs },
		} = renderHook(useSetPromptConfigs);

		setPromptConfigs(applicationId, promptConfigs);

		const invalidName = promptConfigs[0].name;

		const { rerender } = render(
			<PromptConfigBaseForm
				validateConfigName={vi.fn()}
				setIsValid={vi.fn()}
				configName=""
				modelType={{} as ModelType<any>}
				modelVendor={ModelVendor.OpenAI}
				setConfigName={vi.fn()}
				setModelType={vi.fn()}
				setVendor={vi.fn()}
			/>,
		);

		let nameInput: HTMLInputElement;
		await waitFor(() => {
			nameInput = screen.getByTestId(
				'create-prompt-base-form-name-input',
			);
			expect(nameInput).toBeInTheDocument();
		});

		expect(
			screen.getByTestId('create-prompt-base-form-vendor-select'),
		).toBeInTheDocument();
		expect(
			screen.getByTestId('create-prompt-base-form-model-select'),
		).toBeInTheDocument();

		rerender(
			<PromptConfigBaseForm
				validateConfigName={vi.fn()}
				setIsValid={vi.fn()}
				configName={invalidName}
				modelType={{} as ModelType<any>}
				modelVendor={ModelVendor.OpenAI}
				setConfigName={vi.fn()}
				setModelType={vi.fn()}
				setVendor={vi.fn()}
			/>,
		);

		await waitFor(() => {
			expect(
				screen.getByTestId('invalid-name-message'),
			).toBeInTheDocument();
		});

		expect(screen.getByTestId('label-help-text')).toBeInTheDocument();
	});

	it('should display an error message if the name is too short', async () => {
		const { rerender } = render(
			<PromptConfigBaseForm
				validateConfigName={vi.fn()}
				setIsValid={vi.fn()}
				configName=""
				modelType={{} as ModelType<any>}
				modelVendor={ModelVendor.OpenAI}
				setConfigName={vi.fn()}
				setModelType={vi.fn()}
				setVendor={vi.fn()}
			/>,
		);

		let nameInput: HTMLInputElement;
		await waitFor(() => {
			nameInput = screen.getByTestId(
				'create-prompt-base-form-name-input',
			);
			expect(nameInput).toBeInTheDocument();
		});

		expect(
			screen.getByTestId('create-prompt-base-form-vendor-select'),
		).toBeInTheDocument();
		expect(
			screen.getByTestId('create-prompt-base-form-model-select'),
		).toBeInTheDocument();

		rerender(
			<PromptConfigBaseForm
				validateConfigName={vi.fn()}
				setIsValid={vi.fn()}
				configName={'a'}
				modelType={{} as ModelType<any>}
				modelVendor={ModelVendor.OpenAI}
				setConfigName={vi.fn()}
				setModelType={vi.fn()}
				setVendor={vi.fn()}
			/>,
		);

		await waitFor(() => {
			expect(
				screen.getByTestId('invalid-length-message'),
			).toBeInTheDocument();
		});

		expect(screen.getByTestId('label-help-text')).toBeInTheDocument();
	});

	it('should display and allow editing of the config name input field', () => {
		const configName = 'Test Config';
		const setConfigName = vi.fn();
		render(
			<PromptConfigBaseForm
				validateConfigName={vi.fn()}
				setIsValid={vi.fn()}
				configName={configName}
				modelType={{} as ModelType<any>}
				modelVendor={ModelVendor.OpenAI}
				setConfigName={setConfigName}
				setModelType={vi.fn()}
				setVendor={vi.fn()}
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
				validateConfigName={vi.fn()}
				setIsValid={vi.fn()}
				configName=""
				modelType={{} as ModelType<any>}
				modelVendor={modelVendor}
				setConfigName={vi.fn()}
				setModelType={vi.fn()}
				setVendor={vi.fn()}
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
				validateConfigName={vi.fn()}
				setIsValid={vi.fn()}
				configName=""
				modelType={modelType}
				modelVendor={modelVendor}
				setConfigName={vi.fn()}
				setModelType={setModelType}
				setVendor={vi.fn()}
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

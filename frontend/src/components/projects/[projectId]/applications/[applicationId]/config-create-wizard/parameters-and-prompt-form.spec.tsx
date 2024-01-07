import {
	OpenAIPromptMessageFactory,
	OpenAIPromptParametersFactory,
} from 'tests/factories';
import { fireEvent, render, screen, waitFor } from 'tests/test-utils';

import { PromptConfigParametersAndPromptForm } from '@/components/projects/[projectId]/applications/[applicationId]/config-create-wizard/parameters-and-prompt-form';
import { ModelVendor, OpenAIModelType } from '@/types';

describe('PromptConfigParametersAndPromptForm tests', () => {
	it('should render the OpenAIModelParametersForm and OpenAIPromptTemplateForm when is OpenAI', async () => {
		render(
			<PromptConfigParametersAndPromptForm
				modelVendor={ModelVendor.OpenAI}
				modelType={OpenAIModelType.Gpt35Turbo}
				messages={OpenAIPromptMessageFactory.batchSync(2)}
				existingParameters={OpenAIPromptParametersFactory.buildSync()}
				setParameters={vi.fn()}
				setMessages={vi.fn()}
			/>,
		);

		await waitFor(() => {
			expect(
				screen.getByTestId('parameters-and-prompt-form-container'),
			).toBeInTheDocument();
		});

		expect(
			screen.getByTestId('openai-prompt-template-form'),
		).toBeInTheDocument();

		const toggleButton = screen.getByTestId('advanced-options-toggle');
		fireEvent.click(toggleButton);

		await waitFor(() => {
			expect(
				screen.getByTestId('openai-model-parameters-form'),
			).toBeInTheDocument();
		});
	});

	it('should render the CohereModelParametersForm and CoherePromptTemplateForm when is Cohere', async () => {
		render(
			<PromptConfigParametersAndPromptForm
				modelVendor={ModelVendor.Cohere}
				modelType={OpenAIModelType.Gpt35Turbo}
				messages={OpenAIPromptMessageFactory.batchSync(2)}
				existingParameters={OpenAIPromptParametersFactory.buildSync()}
				setParameters={vi.fn()}
				setMessages={vi.fn()}
			/>,
		);

		await waitFor(() => {
			expect(
				screen.getByTestId('parameters-and-prompt-form-container'),
			).toBeInTheDocument();
		});

		expect(
			screen.getByTestId('cohere-prompt-template-form'),
		).toBeInTheDocument();

		const toggleButton = screen.getByTestId('advanced-options-toggle');
		fireEvent.click(toggleButton);

		await waitFor(() => {
			expect(
				screen.getByTestId('cohere-model-parameters-form'),
			).toBeInTheDocument();
		});
	});
});

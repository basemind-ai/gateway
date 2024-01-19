import {
	CohereMessageFactory,
	OpenAIPromptMessageFactory,
} from 'tests/factories';
import { render, screen, waitFor } from 'tests/test-utils';

import { PromptContentDisplay } from '@/components/prompt-display-components/prompt-content-display';
import { ModelVendor } from '@/types';

describe('PromptContentDisplay', () => {
	it('should display an array of openAI messages correctly', () => {
		const messages = OpenAIPromptMessageFactory.batchSync(10);

		render(
			<PromptContentDisplay
				messages={messages}
				modelVendor={ModelVendor.OpenAI}
			/>,
		);

		const messageContainer = screen.getByTestId(
			'prompt-content-display-container',
		);
		expect(messageContainer).toBeInTheDocument();
		expect(messageContainer.children.length).toBe(10);

		for (const [i, message] of messages.entries()) {
			const content = `[${message.role} message]: ${message.content}`;
			expect(content).toBe(messageContainer.children[i].textContent);
		}
	});

	it('should display a cohere message correctly', () => {
		const message = CohereMessageFactory.buildSync();
		render(
			<PromptContentDisplay
				messages={[message]}
				modelVendor={ModelVendor.Cohere}
			/>,
		);
		const messageContainer = screen.getByTestId(
			'prompt-content-display-container',
		);
		expect(messageContainer).toBeInTheDocument();
		expect(messageContainer).toHaveTextContent(message.message);
	});

	it('should parse template variables correctly for OpenAI messages', async () => {
		const messages = OpenAIPromptMessageFactory.batchSync(3);
		messages[0].content = 'Hello {var1}';
		messages[1].content = 'Hello {var2}';
		messages[2].content = 'Hello {var3}';

		const templateVariables = {
			var1: 'world',
			var2: 'there',
		};

		render(
			<PromptContentDisplay
				messages={messages}
				modelVendor={ModelVendor.OpenAI}
				templateVariables={templateVariables}
			/>,
		);
		const messageContainer = screen.getByTestId(
			'prompt-content-display-container',
		);
		expect(messageContainer).toBeInTheDocument();

		const variables = screen.queryAllByTestId('template-variable');
		await waitFor(() => {
			expect(variables.length).toBe(3);
		});

		expect(variables[0]).toHaveTextContent('world');
		expect(variables[1]).toHaveTextContent('there');
		expect(variables[2]).toHaveTextContent('{var3}');
	});

	it('should parse template variables correctly for Cohere messages', async () => {
		const message = CohereMessageFactory.buildSync({
			message: `
			Hello {var1}
			Hello {var2}
			Hello {var3}
			`,
		});
		const templateVariables = {
			var1: 'world',
			var2: 'there',
		};

		render(
			<PromptContentDisplay
				messages={[message]}
				modelVendor={ModelVendor.Cohere}
				templateVariables={templateVariables}
			/>,
		);
		const messageContainer = screen.getByTestId(
			'prompt-content-display-container',
		);
		expect(messageContainer).toBeInTheDocument();

		const variables = screen.queryAllByTestId('template-variable');
		await waitFor(() => {
			expect(variables.length).toBe(3);
		});

		expect(variables[0]).toHaveTextContent('world');
		expect(variables[1]).toHaveTextContent('there');
		expect(variables[2]).toHaveTextContent('{var3}');
	});
});

import { faker } from '@faker-js/faker';
import { fireEvent, render, screen, waitFor } from 'tests/test-utils';

import { PromptConfigCodeSnippet } from '@/components/projects/[projectId]/applications/[applicationId]/configs/[configId]/prompt-config-code-snippet';

describe('PromptConfigCodeSnippet', () => {
	const supportedLanguages = ['kotlin', 'swift', 'dart'];
	const promptConfigId = faker.string.uuid();

	const writeTextMock = vi.fn();

	// @ts-expect-error
	navigator.clipboard = { writeText: writeTextMock };

	it('should render the component with the default framework selected', async () => {
		render(
			<PromptConfigCodeSnippet
				promptConfigId={promptConfigId}
				isDefaultConfig={true}
				expectedVariables={[]}
			/>,
		);

		await waitFor(() => {
			expect(
				screen.getByTestId('prompt-code-snippet-container'),
			).toBeInTheDocument();
		});
		const defaultFrameworkTab = screen.getByTestId('tab-Android');

		expect(defaultFrameworkTab).toBeInTheDocument();
		expect(defaultFrameworkTab).toHaveClass('tab-active');
	});

	it.each(supportedLanguages)(
		'should display the installation snippet for %s',
		async (language: string) => {
			render(
				<PromptConfigCodeSnippet
					promptConfigId={promptConfigId}
					isDefaultConfig={true}
					expectedVariables={[]}
				/>,
			);
			await waitFor(() => {
				expect(
					screen.getByTestId('prompt-code-snippet-container'),
				).toBeInTheDocument();
			});

			const snippet = screen.getByTestId(
				`installation-code-snippet-${language}`,
			);

			expect(snippet).toBeInTheDocument();
		},
	);

	it.each(supportedLanguages)(
		'should display the default init code snippet for %s when isDefaultConfig is true',
		async (language: string) => {
			render(
				<PromptConfigCodeSnippet
					promptConfigId={promptConfigId}
					isDefaultConfig={true}
					expectedVariables={[]}
				/>,
			);
			await waitFor(() => {
				expect(
					screen.getByTestId('prompt-code-snippet-container'),
				).toBeInTheDocument();
			});

			const snippet = screen.getByTestId(
				`default-init-code-snippet-${language}`,
			);

			expect(snippet).toBeInTheDocument();
		},
	);

	it.each(supportedLanguages)(
		'should display the non-default init code snippet for %s when isDefaultConfig is false',
		async (language: string) => {
			render(
				<PromptConfigCodeSnippet
					promptConfigId={promptConfigId}
					isDefaultConfig={false}
					expectedVariables={[]}
				/>,
			);
			await waitFor(() => {
				expect(
					screen.getByTestId('prompt-code-snippet-container'),
				).toBeInTheDocument();
			});

			const snippet = screen.getByTestId(`init-code-snippet-${language}`);

			expect(snippet).toBeInTheDocument();
			expect(snippet.textContent).toContain(promptConfigId);
		},
	);

	it.each(supportedLanguages)(
		'should display the usage snippets without template variables when no template variables are defined',
		async (language: string) => {
			render(
				<PromptConfigCodeSnippet
					promptConfigId={promptConfigId}
					isDefaultConfig={false}
					expectedVariables={[]}
				/>,
			);
			await waitFor(() => {
				expect(
					screen.getByTestId('prompt-code-snippet-container'),
				).toBeInTheDocument();
			});

			const requestSnippet = screen.getByTestId(
				`request-code-snippet-${language}`,
			);

			expect(requestSnippet).toBeInTheDocument();
			expect(requestSnippet.textContent).not.toContain(
				'templateVariables',
			);

			const streamSnippet = screen.getByTestId(
				`stream-code-snippet-${language}`,
			);

			expect(streamSnippet).toBeInTheDocument();
			expect(streamSnippet.textContent).not.toContain(
				'templateVariables',
			);
		},
	);

	it.each(supportedLanguages)(
		'should display the usage snippets with template variables when template variables are defined',
		async (language: string) => {
			render(
				<PromptConfigCodeSnippet
					promptConfigId={promptConfigId}
					isDefaultConfig={false}
					expectedVariables={['var1', 'var2']}
				/>,
			);
			await waitFor(() => {
				expect(
					screen.getByTestId('prompt-code-snippet-container'),
				).toBeInTheDocument();
			});

			const requestSnippet = screen.getByTestId(
				`request-code-snippet-${language}`,
			);

			expect(requestSnippet).toBeInTheDocument();
			expect(requestSnippet.textContent).toContain('templateVariables');
			expect(requestSnippet.textContent).toContain('var1');
			expect(requestSnippet.textContent).toContain('var2');

			const streamSnippet = screen.getByTestId(
				`stream-code-snippet-${language}`,
			);

			expect(streamSnippet).toBeInTheDocument();
			expect(streamSnippet.textContent).toContain('templateVariables');
			expect(streamSnippet.textContent).toContain('var1');
			expect(streamSnippet.textContent).toContain('var2');
		},
	);

	it.each(supportedLanguages)(
		'should route to the %s docs page when the user clicks the view docs button',
		async (language: string) => {
			const openMock = (window.open = vi.fn());
			render(
				<PromptConfigCodeSnippet
					promptConfigId={promptConfigId}
					isDefaultConfig={true}
					expectedVariables={[]}
				/>,
			);

			await waitFor(() => {
				expect(
					screen.getByTestId('prompt-code-snippet-container'),
				).toBeInTheDocument();
			});
			const docsButton = screen.getByTestId(
				`code-snippet-view-docs-button-${language}`,
			);
			fireEvent.click(docsButton);
			expect(openMock).toHaveBeenCalled();
		},
	);

	it('should change the selected framework when a different tab is clicked', async () => {
		render(
			<PromptConfigCodeSnippet
				promptConfigId={promptConfigId}
				isDefaultConfig={true}
				expectedVariables={[]}
			/>,
		);
		await waitFor(() => {
			expect(
				screen.getByTestId('prompt-code-snippet-container'),
			).toBeInTheDocument();
		});
		const iosTab = screen.getByTestId('tab-iOS');
		expect(iosTab).not.toHaveClass('tab-active');
		fireEvent.click(iosTab);
		expect(iosTab).toHaveClass('tab-active');
	});
});

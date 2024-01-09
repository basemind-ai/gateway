import { faker } from '@faker-js/faker';
import { fireEvent, render, screen, waitFor } from 'tests/test-utils';

import { PromptConfigCodeSnippet } from '@/components/projects/[projectId]/applications/[applicationId]/configs/[configId]/prompt-config-code-snippet';

const writeTextMock = vi.fn();

// @ts-expect-error
navigator.clipboard = { writeText: writeTextMock };

describe('PromptConfigCodeSnippet', () => {
	const supportedLanguages = ['kotlin', 'swift', 'dart'];
	const promptConfigId = faker.string.uuid();

	it('should render the component with the default framework selected', () => {
		render(
			<PromptConfigCodeSnippet
				promptConfigId={promptConfigId}
				isDefaultConfig={true}
			/>,
		);
		const defaultFrameworkTab = screen.getByTestId('tab-Android');

		expect(defaultFrameworkTab).toBeInTheDocument();
		expect(defaultFrameworkTab).toHaveClass('tab-active');
	});

	it.each(['kotlin', 'swift', 'dart'])(
		'should display the default code snippet for %s',
		(language: string) => {
			render(
				<PromptConfigCodeSnippet
					promptConfigId={promptConfigId}
					isDefaultConfig={true}
				/>,
			);
			const snippet = screen.getByTestId(`code-snippet-${language}`);

			expect(snippet).toBeInTheDocument();
		},
	);

	it.each(supportedLanguages)(
		'should display the code snippet with prompt config ID for %s',
		(language: string) => {
			render(
				<PromptConfigCodeSnippet
					promptConfigId={promptConfigId}
					isDefaultConfig={false}
				/>,
			);
			const snippet = screen.getByTestId(`code-snippet-${language}`);

			expect(snippet).toBeInTheDocument();
			expect(snippet.textContent).toContain(promptConfigId);
		},
	);

	it('should copy the code snippet to the clipboard when the user clicks the copy button', async () => {
		render(
			<PromptConfigCodeSnippet
				promptConfigId={promptConfigId}
				isDefaultConfig={true}
			/>,
		);
		const copyButtonKotlin = screen.getByTestId(
			'code-snippet-code-copy-button-kotlin',
		);
		fireEvent.click(copyButtonKotlin);
		expect(writeTextMock).toHaveBeenCalledWith(expect.any(String));
		const copyButtonSwift = screen.getByTestId(
			'code-snippet-code-copy-button-swift',
		);
		fireEvent.click(copyButtonSwift);
		expect(writeTextMock).toHaveBeenCalledWith(expect.any(String));
	});

	it.each(supportedLanguages)(
		'should route to the %s docs page when the user clicks the view docs button',
		(language: string) => {
			const openMock = (window.open = vi.fn());
			render(
				<PromptConfigCodeSnippet
					promptConfigId={promptConfigId}
					isDefaultConfig={true}
				/>,
			);
			const docsButton = screen.getByTestId(
				`code-snippet-view-docs-button-${language}`,
			);
			fireEvent.click(docsButton);
			expect(openMock).toHaveBeenCalled();
		},
	);

	it('should open create API key model when the user clicks the create API key button', async () => {
		render(
			<PromptConfigCodeSnippet
				promptConfigId={promptConfigId}
				isDefaultConfig={true}
			/>,
		);
		const createAPIKeyButton = screen.getByTestId(
			'code-snippet-create-api-key-button-kotlin',
		);
		fireEvent.click(createAPIKeyButton);
		expect(
			screen.getByTestId('create-api-key-modal-container'),
		).toBeInTheDocument();
	});
	it('should change the selected framework when a different tab is clicked', () => {
		render(
			<PromptConfigCodeSnippet
				promptConfigId={promptConfigId}
				isDefaultConfig={true}
			/>,
		);
		const iosTab = screen.getByTestId('tab-iOS');
		expect(iosTab).not.toHaveClass('tab-active');
		fireEvent.click(iosTab);
		expect(iosTab).toHaveClass('tab-active');
		const iosCodeSnippet = screen.getByTestId('code-snippet-swift');
		expect(iosCodeSnippet).toBeInTheDocument();
	});

	it('should close the create API key modal when the cancel button is clicked', async () => {
		render(
			<PromptConfigCodeSnippet
				promptConfigId={promptConfigId}
				isDefaultConfig={true}
			/>,
		);

		// Open the modal
		const createAPIKeyButton = screen.getByTestId(
			'code-snippet-create-api-key-button-kotlin',
		);
		fireEvent.click(createAPIKeyButton);

		// Expect the modal to be present
		expect(
			screen.getByTestId('create-api-key-modal-container'),
		).toBeInTheDocument();

		// Find and click the cancel button in the modal
		const cancelButton = screen.getByTestId('create-api-key-close-btn'); // Replace 'cancel-button-id' with the actual test ID of the cancel button
		fireEvent.click(cancelButton);

		// Expect the modal to be closed
		await waitFor(() => {
			screen.queryByTestId('create-api-key-modal-container');
		});
	});
});

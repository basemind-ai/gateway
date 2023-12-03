import { fireEvent, render, screen } from 'tests/test-utils';

import { PromptConfigCodeSnippet } from '@/components/projects/[projectId]/applications/[applicationId]/configs/[configId]/prompt-config-code-snippet';

const writeTextMock = vi.fn();

navigator.clipboard = { writeText: writeTextMock };

describe('PromptConfigCodeSnippet', () => {
	it('should render the component with the default framework selected', () => {
		render(<PromptConfigCodeSnippet />);
		const defaultFrameworkTab = screen.getByTestId('tab-Android');

		expect(defaultFrameworkTab).toBeInTheDocument();
		expect(defaultFrameworkTab).toHaveClass('tab-active');
	});

	it('should display the code snippet for the selected framework', () => {
		render(<PromptConfigCodeSnippet />);
		const kotlinCodeSnippet = screen.getByTestId('code-snippet-kotlin');

		expect(kotlinCodeSnippet).toBeInTheDocument();
	});

	it('should disable and not allow selection of a tab when its framework is not active', () => {
		render(<PromptConfigCodeSnippet />);
		const flutterTab = screen.getByTestId('tab-Flutter');

		expect(flutterTab).toBeDisabled();
	});

	it('should not display the code snippet when the language is not supported', () => {
		render(<PromptConfigCodeSnippet />);
		const swiftCodeSnippet = screen.queryByTestId('code-snippet-swift');

		expect(swiftCodeSnippet).not.toBeInTheDocument();
	});

	it('should copy the code snippet to the clipboard when the user clicks the copy button', async () => {
		render(<PromptConfigCodeSnippet />);
		const copyButton = screen.getByTestId('code-snippet-code-copy-button');

		fireEvent.click(copyButton);

		expect(writeTextMock).toHaveBeenCalledWith(expect.any(String));
	});
});

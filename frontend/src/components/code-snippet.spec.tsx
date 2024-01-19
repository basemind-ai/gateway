import { render, renderHook, screen, waitFor } from 'tests/test-utils';

import { CodeSnippet } from '@/components/code-snippet';
import { useToasts } from '@/stores/toast-store';

const writeTextMock = vi.fn();

// @ts-expect-error
navigator.clipboard = { writeText: writeTextMock };

describe('CodeSnippet', () => {
	it('should render code snippet with specified language and style', () => {
		const codeText = 'const x = 5;';
		const language = 'javascript';

		render(
			<CodeSnippet
				codeText={codeText}
				language={language}
				allowCopy={false}
			/>,
		);

		const codeSnippet = screen.getByTestId('code-snippet-javascript');
		expect(codeSnippet).toBeInTheDocument();
	});

	it('should set data-testid attribute with language value', () => {
		const codeText = 'const x = 5;';
		const language = 'javascript';

		render(
			<CodeSnippet
				codeText={codeText}
				language={language}
				allowCopy={false}
			/>,
		);

		const codeSnippet = screen.getByTestId('code-snippet-javascript');
		expect(codeSnippet).toBeInTheDocument();
	});

	it('should display copy button when allowCopy is true', () => {
		const codeText = 'const x = 5;';
		const language = 'javascript';
		const allowCopy = true;

		render(
			<CodeSnippet
				codeText={codeText}
				language={language}
				allowCopy={allowCopy}
			/>,
		);

		const copyButton = screen.getByTestId(
			`code-snippet-code-copy-button-${language}`,
		);
		expect(copyButton).toBeInTheDocument();
	});

	it('should copy code to clipboard when copy button is clicked', () => {
		const codeText = 'const x = 5;';
		const language = 'javascript';
		const allowCopy = true;

		render(
			<CodeSnippet
				codeText={codeText}
				language={language}
				allowCopy={allowCopy}
			/>,
		);

		const copyButton = screen.getByTestId(
			`code-snippet-code-copy-button-${language}`,
		);
		copyButton.click();

		expect(writeTextMock).toHaveBeenCalledWith(codeText);
	});

	it('should show success message when code is copied', async () => {
		const codeText = 'const x = 5;';
		const language = 'javascript';
		const allowCopy = true;

		render(
			<CodeSnippet
				codeText={codeText}
				language={language}
				allowCopy={allowCopy}
			/>,
		);

		const {
			result: { current },
		} = renderHook(useToasts);

		const copyButton = screen.getByTestId(
			`code-snippet-code-copy-button-${language}`,
		);
		copyButton.click();

		await waitFor(() => {
			expect(current.length).toBe(1);
		});
	});

	it('should not display copy button when allowCopy is false', () => {
		const codeText = 'const x = 5;';
		const language = 'javascript';
		const allowCopy = false;

		render(
			<CodeSnippet
				codeText={codeText}
				language={language}
				allowCopy={allowCopy}
			/>,
		);

		const copyButton = screen.queryByTestId(
			'code-snippet-code-copy-button',
		);
		expect(copyButton).not.toBeInTheDocument();
	});
});

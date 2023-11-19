import { render, screen } from 'tests/test-utils';

import { CodeSnippet } from '@/components/static-site/code-snippet';

describe('CodeSnippet', () => {
	it('should render code snippet with specified language and style', () => {
		const codeText = 'const x = 5;';
		const language = 'javascript';

		render(<CodeSnippet codeText={codeText} language={language} />);

		const codeSnippet = screen.getByTestId('code-snippet-javascript');
		expect(codeSnippet).toBeInTheDocument();
	});

	it('should set data-testid attribute with language value', () => {
		const codeText = 'const x = 5;';
		const language = 'javascript';

		render(<CodeSnippet codeText={codeText} language={language} />);

		const codeSnippet = screen.getByTestId('code-snippet-javascript');
		expect(codeSnippet).toBeInTheDocument();
	});
});

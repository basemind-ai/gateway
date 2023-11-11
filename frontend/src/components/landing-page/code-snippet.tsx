import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { darcula } from 'react-syntax-highlighter/dist/esm/styles/prism';

export function CodeSnippet({
	codeText,
	language,
}: {
	codeText: string;
	language: string;
}) {
	return (
		<div data-testid={`code-snippet-${language}`}>
			<SyntaxHighlighter
				language={language}
				style={darcula as Record<string, any>}
			>
				{codeText}
			</SyntaxHighlighter>
		</div>
	);
}

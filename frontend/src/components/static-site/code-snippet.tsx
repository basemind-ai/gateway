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
		<div
			data-testid={`code-snippet-${language}`}
			className="flex flex-wrap"
		>
			<SyntaxHighlighter
				language={language}
				style={darcula as Record<string, any>}
				className="rounded-4xl text-xs "
			>
				{codeText}
			</SyntaxHighlighter>
		</div>
	);
}

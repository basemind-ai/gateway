'use client';

import { useTranslations } from 'next-intl';
import { Front } from 'react-bootstrap-icons';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { darcula } from 'react-syntax-highlighter/dist/esm/styles/prism';

import { useShowSuccess } from '@/stores/toast-store';
import { copyToClipboard } from '@/utils/helpers';

export function CodeSnippet({
	codeText,
	language,
	allowCopy,
}: {
	allowCopy: boolean;
	codeText: string;
	language: string;
}) {
	const showSuccess = useShowSuccess();
	const t = useTranslations('common');

	return (
		<div
			data-testid={`code-snippet-${language}`}
			className="flex flex-wrap rounded-3xl bg-base-300 w-fit p-6"
		>
			<SyntaxHighlighter
				language={language}
				style={darcula as Record<string, any>}
				lineNumberStyle={{ color: '#ccc' }}
				className="text-xs rounded-3xl bg-base-300"
			>
				{codeText}
			</SyntaxHighlighter>
			{allowCopy && (
				<button
					data-testid="code-snippet-code-copy-button"
					className="self-start"
					onClick={() => {
						copyToClipboard(codeText);
						showSuccess(t('copied'));
					}}
				>
					<Front className="w-4 h-4 text-secondary" />
				</button>
			)}
		</div>
	);
}

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
	dataTestId = `code-snippet-${language}`,
}: {
	allowCopy: boolean;
	codeText: string;
	dataTestId?: string;
	language: string;
}) {
	const showSuccess = useShowSuccess();
	const t = useTranslations('common');

	return (
		<div
			data-testid={dataTestId}
			className="flex flex-col md:flex-row rounded-3xl rounded-tl-none  bg-base-300 md:px-6 py-6"
		>
			<SyntaxHighlighter
				language={language}
				style={darcula as Record<string, any>}
				lineNumberStyle={{ color: '#ccc' }}
				className="text-xs rounded-3xl bg-base-300 max-w-xs sm:max-w-sm md:max-w-screen-xl overflow-x-scroll"
			>
				{codeText}
			</SyntaxHighlighter>
			{allowCopy && (
				<button
					data-testid={`code-snippet-code-copy-button-${language}`}
					className="self-start"
					onClick={() => {
						copyToClipboard(codeText);
						showSuccess(t('copied'));
					}}
				>
					<Front className="w-4 h-4 text-accent" />
				</button>
			)}
		</div>
	);
}

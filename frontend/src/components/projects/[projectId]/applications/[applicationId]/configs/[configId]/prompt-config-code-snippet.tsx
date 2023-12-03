import { useState } from 'react';

import { CodeSnippet } from '@/components/code-snippet';

type supportedLanguages = 'kotlin' | 'dart' | 'typescript' | 'swift';

const kotlinSnippet = `import ai.basemind.client.BaseMindClient

val client = BaseMindClient.getInstance('<API_KEY>')
`;

const languageSnippetMap: Record<supportedLanguages, string | null> = {
	dart: null,
	kotlin: kotlinSnippet,
	swift: null,
	typescript: null,
};

const tabs: {
	framework: string;
	isActive: boolean;
	language: supportedLanguages;
}[] = [
	{ framework: 'Android', isActive: true, language: 'kotlin' },
	{ framework: 'Flutter', isActive: false, language: 'dart' },
	{ framework: 'React Native', isActive: false, language: 'typescript' },
	{ framework: 'iOS', isActive: false, language: 'swift' },
];

export function PromptConfigCodeSnippet() {
	const [selectedFramework, setSelectedFramework] = useState('Android');

	return (
		<div className="tabs tabs-lifted">
			{tabs.map((tab) => {
				const snippet = languageSnippetMap[tab.language];
				return (
					<>
						<button
							key={tab.framework}
							name="tabs"
							data-testid={`tab-${tab.framework}`}
							className={`tab bg-base-100 text-base-content rounded-xl3 ${
								selectedFramework === tab.framework
									? 'tab-active border-base-300'
									: ''
							}`}
							aria-label={tab.framework}
							disabled={!tab.isActive}
							onClick={() => {
								setSelectedFramework(tab.framework);
							}}
						>
							<span
								className="text-info"
								data-testid={`tab-text-${tab.framework}`}
							>
								{tab.framework}
							</span>
						</button>
						<div
							className="tab-content bg-base-100 border-base-300 w-fit p-6"
							data-testid={`tab-content-${tab.framework}-container`}
						>
							{snippet ? (
								<CodeSnippet
									codeText={snippet}
									language={tab.language}
									allowCopy={true}
								/>
							) : null}
						</div>
					</>
				);
			})}
		</div>
	);
}

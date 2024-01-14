'use client';
import { Fragment, useState } from 'react';

import { CodeSnippet } from '@/components/code-snippet';

interface FrameworkTab {
	docs?: string;
	framework: string;
	isActive: boolean;
	language: supportedLanguages;
}

type supportedLanguages = 'kotlin' | 'dart' | 'typescript' | 'swift';

const docsKotlin =
	'https://github.com/basemind-ai/sdk-android/tree/main?tab=readme-ov-file#basemindai-android-sdk';
const snippetKotlin = `import ai.basemind.client.BaseMindClient

val client = BaseMindClient.getInstance("<API_KEY")
`;

const docsSwift =
	'https://github.com/basemind-ai/sdk-ios?tab=readme-ov-file#basemindai-swift-iosmacos-sdk';
const snippetSwift = `import BaseMindClient

let client = BaseMindClient(apiKey: "<MyApiKey>")`;

const docsFlutter = 'https://pub.dev/packages/basemind';
const snippetDart = `import 'package:basemind/client.dart';

final client = BaseMindClient('<API_KEY>');`;

const languageSnippetMap: Record<supportedLanguages, string | null> = {
	dart: snippetDart,
	kotlin: snippetKotlin,
	swift: snippetSwift,
	typescript: null,
};

const tabs: FrameworkTab[] = [
	{
		docs: docsKotlin,
		framework: 'Android',
		isActive: true,
		language: 'kotlin',
	},
	{ docs: docsSwift, framework: 'iOS', isActive: true, language: 'swift' },
	{
		docs: docsFlutter,
		framework: 'Flutter',
		isActive: true,
		language: 'dart',
	},
];

export function MarketingCodeSnippet() {
	const [selectedFramework, setSelectedFramework] = useState('Android');

	return (
		<Fragment>
			<div
				className="tabs tabs-lifted mt-3.5"
				data-testid="prompt-code-snippet-container"
			>
				{tabs.map((tab) => {
					const snippet = languageSnippetMap[tab.language];
					return (
						<Fragment key={tab.framework}>
							<button
								name="tabs"
								data-testid={`tab-${tab.framework}`}
								className={`tab bg-base-200 text-base-content rounded-b-none hover:bg-neutral ${
									selectedFramework === tab.framework &&
									'tab-active bg-base-300 text-primary'
								}`}
								aria-label={tab.framework}
								disabled={!tab.isActive}
								onClick={() => {
									setSelectedFramework(tab.framework);
								}}
							>
								<span data-testid={`tab-text-${tab.framework}`}>
									{tab.framework}
								</span>
							</button>
							<div
								className="tab-content"
								data-testid={`tab-content-${tab.framework}-container`}
							>
								{snippet ? (
									<CodeSnippet
										codeText={snippet}
										language={tab.language}
										allowCopy={false}
									/>
								) : null}
							</div>
						</Fragment>
					);
				})}
			</div>
		</Fragment>
	);
}

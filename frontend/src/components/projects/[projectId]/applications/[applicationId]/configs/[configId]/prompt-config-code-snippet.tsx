import { useTranslations } from 'next-intl';
import { Fragment, useState } from 'react';
import { Github, KeyFill } from 'react-bootstrap-icons';

import { CodeSnippet } from '@/components/code-snippet';
import { Modal } from '@/components/modal';
import { CreateApplicationAPIKeyModal } from '@/components/projects/[projectId]/applications/[applicationId]/application-create-api-key';
import { useAnalytics } from '@/hooks/use-analytics';

interface FrameworkTab {
	docs?: string;
	framework: string;
	isActive: boolean;
	language: supportedLanguages;
}

type supportedLanguages = 'kotlin' | 'dart' | 'swift';

/*
 * Kotlin
 * */

const docsKotlin =
	'https://github.com/basemind-ai/sdk-android/tree/main?tab=readme-ov-file#basemindai-android-sdk';

const snippetKotlin = `import ai.basemind.client.BaseMindClient

val client = BaseMindClient.getInstance("<API_KEY", promptConfigId = "CONFIG_ID")
`;

const snippetKotlinDefaultConfig = `import ai.basemind.client.BaseMindClient

val client = BaseMindClient.getInstance('<API_KEY>')
`;

/*
 * Swift
 * */

const docsSwift =
	'https://github.com/basemind-ai/sdk-ios?tab=readme-ov-file#basemindai-swift-iosmacos-sdk';
const snippetSwift = `import BaseMindClient

let client = BaseMindClient(apiKey: "<MyApiKey>", options: ClientOptions(promptConfigId: "CONFIG_ID"))`;

const snippetSwiftDefaultConfig = `import BaseMindClient

let client = BaseMindClient(apiKey: "<MyApiKey>")`;

/*
 * Dart
 * */

const docsDart = 'https://pub.dev/packages/basemind';
const snippetDart = `import 'package:basemind/client.dart';

final client = BaseMindClient('<API_KEY>', "CONFIG_ID");`;

const snippetDartDefaultConfig = `import 'package:basemind/client.dart';

final client = BaseMindClient('<API_KEY>');`;

// ---

const languageSnippetMap: Record<
	supportedLanguages,
	[defaultConfigSnippet: string, withConfigIdSnippet: string]
> = {
	dart: [snippetDartDefaultConfig, snippetDart],
	kotlin: [snippetKotlinDefaultConfig, snippetKotlin],
	swift: [snippetSwiftDefaultConfig, snippetSwift],
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
		docs: docsDart,
		framework: 'Flutter',
		isActive: true,
		language: 'dart',
	},
	// {
	// 	docs: undefined,
	// 	framework: 'React Native',
	// 	isActive: false,
	// 	language: 'typescript',
	// },
];

export function PromptConfigCodeSnippet({
	projectId,
	applicationId,
	isDefaultConfig,
	promptConfigId,
}: {
	applicationId: string;
	isDefaultConfig: boolean;
	projectId: string;
	promptConfigId: string;
}) {
	const t = useTranslations('configCodeSnippet');
	const { initialized, track } = useAnalytics();

	const [selectedFramework, setSelectedFramework] = useState('Android');
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

	const handleDocClick = (tab: FrameworkTab) => {
		return () => {
			if (initialized) {
				track('clickViewDocs', {
					category: 'config-code-snippet',
					framework: tab.framework,
				});
			}
			window.open(tab.docs, '_blank')?.focus();
		};
	};
	const openCreationPopup = () => {
		setIsCreateModalOpen(true);
	};

	const closeCreationPopup = () => {
		setIsCreateModalOpen(false);
	};

	return (
		<>
			<h2 className="card-header">{t('implement')}</h2>
			<div
				className="tabs tabs-lifted mt-3.5"
				data-testid="prompt-code-snippet-container"
			>
				{tabs.map((tab) => {
					const [defaultSnippet, snippetWithConfigId] =
						languageSnippetMap[tab.language];

					const snippet = isDefaultConfig
						? defaultSnippet
						: snippetWithConfigId.replace(
								'CONFIG_ID',
								promptConfigId,
							);

					return (
						<Fragment key={tab.framework}>
							<button
								name="tabs"
								data-testid={`tab-${tab.framework}`}
								className={`tab [--tab-bg:bg-base-100] text-base-content rounded-b-none hover:bg-neutral ${
									selectedFramework === tab.framework &&
									'tab-active bg-base-200 border-base-300 hover:bg-base-300'
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
								className="tab-content rounded-data-card rounded-tl-none mt-0  w-full p-6"
								data-testid={`tab-content-${tab.framework}-container`}
							>
								<div className="flex flex-col lg:flex-row content-center">
									<div className="flex lg:flex-col px-8 justify-evenly text-left pb-4 lg:pb-0">
										<button
											className="btn btn-sm btn-neutral h-fit"
											disabled={!tab.docs}
											onClick={handleDocClick(tab)}
											data-testid={`code-snippet-view-docs-button-${tab.language}`}
										>
											<Github className="w-4 h-4" />
											<span className="text-sm">
												{t('documentation')}
											</span>
										</button>
										<button
											className="btn btn-sm btn-neutral"
											onClick={() => {
												openCreationPopup();
											}}
											data-testid={`code-snippet-create-api-key-button-${tab.language}`}
										>
											<KeyFill className="w-4 h-4" />
											<span className="text-sm">
												{t('createAPIKey')}
											</span>
										</button>
									</div>
									<div className="flex justify-center">
										<CodeSnippet
											codeText={snippet}
											language={tab.language}
											allowCopy={true}
										/>
									</div>
								</div>
							</div>
						</Fragment>
					);
				})}
			</div>
			<Modal modalOpen={isCreateModalOpen}>
				<CreateApplicationAPIKeyModal
					projectId={projectId}
					applicationId={applicationId}
					onCancel={closeCreationPopup}
					onSubmit={() => {
						closeCreationPopup();
					}}
				/>
			</Modal>
		</>
	);
}

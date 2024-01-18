/* eslint-disable sonarjs/no-nested-template-literals */
import { useTranslations } from 'next-intl';
import { Fragment, memo, useCallback, useMemo, useState } from 'react';
import { Github } from 'react-bootstrap-icons';

import { CodeSnippet } from '@/components/code-snippet';
import { useAnalytics } from '@/hooks/use-analytics';

interface ReplacerMap {
	invokeReplacer: (
		value: string,
		expectedTemplateVariables: string[],
	) => string;
	parametersReplacer: (
		value: string,
		expectedTemplateVariables: string[],
	) => string;
}

interface FrameworkTab {
	docs: string;
	framework: string;
	isActive: boolean;
	language: supportedLanguages;
	replacers: ReplacerMap;
}

type supportedLanguages = 'kotlin' | 'dart' | 'swift';

const apiKey = '<API_KEY>';
const configId = '<CONFIG_ID>';
const functionInvoke = '<FUNCTION_INVOKE>';
const functionParameters = '<FUNCTION_PARAMETERS>';
const input = '<INPUT>';

/*
 * Kotlin
 * */

const kotlinDocs =
	'https://github.com/basemind-ai/sdk-android/tree/main?tab=readme-ov-file#basemindai-android-sdk';

const kotlinInstallationSnippet = `dependencies {
    implementation("ai.basemind:client:1.0.0")
}`;

const kotlinInitSnippet = `import ai.basemind.client.BaseMindClient

val client = BaseMindClient.getInstance(
	"${apiKey}",
	promptConfigId = "${configId}",
)
`;

const kotlinDefaultInitSnippet = `import ai.basemind.client.BaseMindClient

val client = BaseMindClient.getInstance('${apiKey}')
`;

const kotlinRequestSnippet = `fun handlePromptRequest(${functionParameters}): String {
    val response = client.requestPrompt(templateVariables)

    return response.content
}

val prompt = handlePromptRequest(${functionInvoke})
`;

const kotlinStreamSnippet = `fun handlePromptStream(${functionParameters}): MutableList<String> {
    val response = client.requestStream(templateVariables)

    val chunks: MutableList<String> = mutableListOf()
    response.collect { chunk -> chunks.add(chunk.content) }

    return chunks
}

val chunks = handlePromptStream(${functionInvoke})
`;

const kotlinPlaceholderReplacers: ReplacerMap = {
	invokeReplacer: (value: string, expectedTemplateVariables: string[]) =>
		value.replace(
			functionInvoke,
			expectedTemplateVariables.length
				? `mapOf(\n${expectedTemplateVariables
						.map((v) => `\t"${v}" to "${input}"`)
						.join(', \n')}\n)`
				: '',
		),
	parametersReplacer: (value: string, expectedTemplateVariables: string[]) =>
		value.replace(
			functionParameters,
			expectedTemplateVariables.length
				? 'templateVariables: Map<String, String>'
				: '',
		),
};

/*
 * Swift
 * */

const swiftDocs =
	'https://github.com/basemind-ai/sdk-ios?tab=readme-ov-file#basemindai-swift-iosmacos-sdk';

const swiftInstallationSnippet = `dependencies: [
	.package(url: "https://github.com/basemind-ai/sdk-ios.git", from: "1.0.0"),
],
targets: [
	.target(
		name: "MyApp", // your target name here
		dependencies: ["BaseMindClient"]
	),
]`;

const swiftInitSnippet = `import BaseMindClient

let client = BaseMindClient(
	apiKey: "${apiKey}",
	options: ClientOptions(promptConfigId: "${configId}"),
)`;

const swiftDefaultInitSnippet = `import BaseMindClient

let client = BaseMindClient(apiKey: "${apiKey}")`;

const swiftRequestSnippet = `func handlePromptRequest(${functionParameters}) async throws -> String {
    let response = try client.requestPrompt(templateVariables)

    return response.content
}

let prompt = try await handlePromptRequest(${functionInvoke})
`;

const swiftStreamSnippet = `func handlePromptStream(${functionParameters}) async throws -> [String] {
    let stream = try client.requestStream(templateVariables)

    var chunks: [String] = []
    for try await response in stream {
        chunks.append(response.content)
    }

    return chunks
}

let chunks = try await handlePromptStream(${functionInvoke})
`;

const swiftPlaceholderReplacers: ReplacerMap = {
	invokeReplacer: (value: string, expectedTemplateVariables: string[]) =>
		value.replace(
			functionInvoke,
			expectedTemplateVariables.length
				? `[
${expectedTemplateVariables
	.map((v) => `\t"${v}": "${input}"`)
	.join(', \n')},\n]`
				: '',
		),
	parametersReplacer: (value: string, expectedTemplateVariables: string[]) =>
		value.replace(
			functionParameters,
			expectedTemplateVariables.length
				? 'templateVariables: [String: String]'
				: '',
		),
};

/*
 * Dart
 * */

const dartDocs = 'https://pub.dev/packages/basemind';

const dartInstallationSnippet = `flutter pub add basemind

# or using dart
# dart pub add basemind
`;

const dartInitSnippet = `import 'package:basemind/client.dart';

final client = BaseMindClient(
	'${apiKey}',
	"${configId}",
);`;

const dartDefaultInitSnippet = `import 'package:basemind/client.dart';
import * as url from 'url';

final client = BaseMindClient('${apiKey}');`;

const dartRequestSnippet = `Future<String> handlePromptRequest(${functionParameters}) async {
	final response = await client.requestPrompt(templateVariables);

	return response.content;
}

final prompt = await handlePromptRequest(${functionInvoke});
`;

const dartStreamSnippet = `handlePromptStream(${functionParameters}) {
  final stream = client.requestStream(templateVariables);
  stream.listen((response) {
    print(response.content);
  });
}

handlePromptStream(${functionInvoke});
`;

const dartPlaceholderReplacers: ReplacerMap = {
	invokeReplacer: (value: string, expectedTemplateVariables: string[]) =>
		value.replace(
			functionInvoke,
			expectedTemplateVariables.length
				? `{
${expectedTemplateVariables.map((v) => `\t'${v}': '${input}'`).join(',\n')},\n}`
				: '',
		),
	parametersReplacer: (value: string, expectedTemplateVariables: string[]) =>
		value.replace(
			functionParameters,
			expectedTemplateVariables.length
				? 'Map<String, String> templateVariables'
				: '',
		),
};
// ---

const tabs: FrameworkTab[] = [
	{
		docs: kotlinDocs,
		framework: 'Android',
		isActive: true,
		language: 'kotlin',
		replacers: kotlinPlaceholderReplacers,
	},
	{
		docs: swiftDocs,
		framework: 'iOS',
		isActive: true,
		language: 'swift',
		replacers: swiftPlaceholderReplacers,
	},
	{
		docs: dartDocs,
		framework: 'Flutter',
		isActive: true,
		language: 'dart',
		replacers: dartPlaceholderReplacers,
	},
];

const importSnippetMap: Record<
	supportedLanguages,
	React.FC<{
		isDefault: boolean;
		promptConfigId: string;
	}>
> = {
	dart: memo(
		({
			promptConfigId,
			isDefault,
		}: {
			isDefault: boolean;
			promptConfigId: string;
		}) => (
			<CodeSnippet
				codeText={
					isDefault
						? dartDefaultInitSnippet
						: dartInitSnippet.replaceAll(configId, promptConfigId)
				}
				language="dart"
				allowCopy={true}
				dataTestId={
					isDefault
						? 'default-init-code-snippet-dart'
						: 'init-code-snippet-dart'
				}
			/>
		),
	),
	kotlin: memo(
		({
			promptConfigId,
			isDefault,
		}: {
			isDefault: boolean;
			promptConfigId: string;
		}) => (
			<CodeSnippet
				codeText={
					isDefault
						? kotlinDefaultInitSnippet
						: kotlinInitSnippet.replaceAll(configId, promptConfigId)
				}
				language="kotlin"
				allowCopy={true}
				dataTestId={
					isDefault
						? 'default-init-code-snippet-kotlin'
						: 'init-code-snippet-kotlin'
				}
			/>
		),
	),
	swift: memo(
		({
			promptConfigId,
			isDefault,
		}: {
			isDefault: boolean;
			promptConfigId: string;
		}) => (
			<CodeSnippet
				codeText={
					isDefault
						? swiftDefaultInitSnippet
						: swiftInitSnippet.replaceAll(configId, promptConfigId)
				}
				language="swift"
				allowCopy={true}
				dataTestId={
					isDefault
						? 'default-init-code-snippet-swift'
						: 'init-code-snippet-swift'
				}
			/>
		),
	),
};

const installationSnippetMap: Record<supportedLanguages, React.FC> = {
	dart: memo(() => (
		<CodeSnippet
			codeText={dartInstallationSnippet}
			language="bash"
			allowCopy={true}
			dataTestId="installation-code-snippet-dart"
		/>
	)),
	kotlin: memo(() => (
		<CodeSnippet
			codeText={kotlinInstallationSnippet}
			language="kotlin"
			allowCopy={true}
			dataTestId="installation-code-snippet-kotlin"
		/>
	)),
	swift: memo(() => (
		<CodeSnippet
			codeText={swiftInstallationSnippet}
			language="swift"
			allowCopy={true}
			dataTestId="installation-code-snippet-swift"
		/>
	)),
};

const promptRequestSnippetMap: Record<
	supportedLanguages,
	React.FC<{
		replacer: (value: string) => string;
	}>
> = {
	dart: memo(({ replacer }) => (
		<CodeSnippet
			codeText={replacer(dartRequestSnippet)}
			language="dart"
			allowCopy={true}
			dataTestId="request-code-snippet-dart"
		/>
	)),
	kotlin: memo(({ replacer }) => (
		<CodeSnippet
			codeText={replacer(kotlinRequestSnippet)}
			language="kotlin"
			allowCopy={true}
			dataTestId="request-code-snippet-kotlin"
		/>
	)),
	swift: memo(({ replacer }) => (
		<CodeSnippet
			codeText={replacer(swiftRequestSnippet)}
			language="swift"
			allowCopy={true}
			dataTestId="request-code-snippet-swift"
		/>
	)),
};

const promptStreamSnippetMap: Record<
	supportedLanguages,
	React.FC<{
		replacer: (value: string) => string;
	}>
> = {
	dart: memo(({ replacer }) => (
		<CodeSnippet
			codeText={replacer(dartStreamSnippet)}
			language="dart"
			allowCopy={true}
			dataTestId="stream-code-snippet-dart"
		/>
	)),
	kotlin: memo(({ replacer }) => (
		<CodeSnippet
			codeText={replacer(kotlinStreamSnippet)}
			language="kotlin"
			allowCopy={true}
			dataTestId="stream-code-snippet-kotlin"
		/>
	)),
	swift: memo(({ replacer }) => (
		<CodeSnippet
			codeText={replacer(swiftStreamSnippet)}
			language="swift"
			allowCopy={true}
			dataTestId="stream-code-snippet-swift"
		/>
	)),
};

export function PromptConfigCodeSnippet({
	isDefaultConfig,
	promptConfigId,
	expectedVariables,
}: {
	expectedVariables: string[];
	isDefaultConfig: boolean;
	promptConfigId: string;
}) {
	const t = useTranslations('configCodeSnippet');
	const { initialized, track } = useAnalytics();

	const [selectedFramework, setSelectedFramework] = useState('Android');

	const handleDocClick = useCallback(
		(tab: FrameworkTab) => {
			return () => {
				if (initialized) {
					track('clickViewDocs', {
						category: 'config-code-snippet',
						framework: tab.framework,
					});
				}
				window.open(tab.docs, '_blank')?.focus();
			};
		},
		[track, initialized],
	);

	const mappedTabs = useMemo(
		() =>
			tabs.map((tab) => {
				const InstallationSnippet =
					installationSnippetMap[tab.language];
				const ImportSnippet = importSnippetMap[tab.language];
				const RequestSnippet = promptRequestSnippetMap[tab.language];
				const StreamSnippet = promptStreamSnippetMap[tab.language];

				const replacer = (value: string) => {
					value = tab.replacers.parametersReplacer(
						tab.replacers.invokeReplacer(value, expectedVariables),
						expectedVariables,
					);

					if (!expectedVariables.length) {
						value = value.replaceAll('templateVariables', '');
					}

					return value;
				};

				return (
					<Fragment key={tab.framework}>
						<button
							name="tabs"
							data-testid={`tab-${tab.framework}`}
							className={`tab [--tab-bg:bg-natural] text-base-content rounded-b-none hover:bg-neutral ${
								selectedFramework === tab.framework &&
								'tab-active bg-base-200'
							}`}
							aria-label={tab.framework}
							disabled={!tab.isActive}
							onClick={() => {
								setSelectedFramework(tab.framework);
							}}
						>
							<span
								className="text-base-content"
								data-testid={`tab-text-${tab.framework}`}
							>
								{tab.framework}
							</span>
						</button>
						<div
							className="tab-content rounded-data-card rounded-tl-none mt-0 w-full p-6"
							data-testid={`tab-content-${tab.framework}-container`}
						>
							<div className="flex flex-col">
								<div className="sm:flex sm:flex-col md:grid md:grid-cols-2 sm:gap-4 md:gap-8">
									<div className="flex flex-col gap-2">
										<div className="pb-2 flex items-center gap-2">
											<span className="text-sm text-neutral-content">
												1.{'	'}
												{t(
													`${tab.language}InstallationText`,
												)}
											</span>
										</div>
										<InstallationSnippet />
									</div>
									<div className="flex flex-col gap-2">
										<div className="pb-2 flex items-center gap-2">
											<span className="text-sm text-neutral-content">
												2.{'	'}
												{t('importText')}
											</span>
										</div>
										<ImportSnippet
											isDefault={isDefaultConfig}
											promptConfigId={promptConfigId}
										/>
									</div>
									<div className="flex flex-col gap-2">
										<div className="pb-2 flex items-center gap-2">
											<span className="text-sm text-neutral-content">
												3.{'	'}
												{t('usageRequestText')}
											</span>
										</div>
										<RequestSnippet replacer={replacer} />
									</div>
									<div className="flex flex-col gap-2">
										<div className="pb-2 flex items-center gap-2">
											<span className="text-sm text-neutral-content">
												4.{'	'}
												{t('usageStreamText')}
											</span>
										</div>
										<StreamSnippet replacer={replacer} />
									</div>
								</div>
								<button
									className="btn btn-sm w-fit btn-primary"
									disabled={!tab.docs}
									onClick={handleDocClick(tab)}
									data-testid={`code-snippet-view-docs-button-${tab.language}`}
								>
									<Github className="w-4 h-4" />
									<span className="text-sm">
										{t('documentation')}
									</span>
								</button>
							</div>
						</div>
					</Fragment>
				);
			}),
		[
			expectedVariables,
			selectedFramework,
			handleDocClick,
			isDefaultConfig,
			promptConfigId,
			t,
		],
	);

	return (
		<>
			<h2 className="card-header">{t('implement')}</h2>
			<div
				className="tabs tabs-lifted mt-3.5"
				data-testid="prompt-code-snippet-container"
			>
				{mappedTabs}
			</div>
		</>
	);
}

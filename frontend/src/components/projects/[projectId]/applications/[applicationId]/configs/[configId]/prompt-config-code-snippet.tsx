import { useTranslations } from 'next-intl';
import { Fragment, memo, useState } from 'react';
import { Github } from 'react-bootstrap-icons';

import { CodeSnippet } from '@/components/code-snippet';
import { useAnalytics } from '@/hooks/use-analytics';

interface FrameworkTab {
	docs: string;
	framework: string;
	isActive: boolean;
	language: supportedLanguages;
}

type supportedLanguages = 'kotlin' | 'dart' | 'swift';

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
	"<API_KEY",
	promptConfigId = "CONFIG_ID",
)
`;

const kotlinDefaultInitSnippet = `import ai.basemind.client.BaseMindClient

val client = BaseMindClient.getInstance('<API_KEY>')
`;

const kotlinRequestSnippet = `fun handlePromptRequest(userInput: String): String {
    val map = mapOf("userInput" to userInput)
    val response = client.requestPrompt(map)

    return response.content
}

val prompt = handlePromptRequest("Hello World!")
`;

const kotlinStreamSnippet = `fun handlePromptStream(userInput: String): MutableList<String> {
    val map = mapOf("userInput" to userInput)
    val response = client.requestStream(map)

    val chunks: MutableList<String> = mutableListOf()
    response.collect { chunk -> chunks.add(chunk.content) }

    return chunks
}

val chunks = handlePromptStream("Hello World!")
`;

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
	apiKey: "<MyApiKey>",
	options: ClientOptions(promptConfigId: "CONFIG_ID"),
)`;

const swiftDefaultInitSnippet = `import BaseMindClient

let client = BaseMindClient(apiKey: "<MyApiKey>")`;

const swiftRequestSnippet = `func handlePromptRequest(userInput: String) async throws -> String {
    let templateVariables = ["userInput": userInput]
    let response = try client.requestPrompt(templateVariables)

    return response.content
}

let prompt = try await handlePromptRequest("Hello World!")
`;

const swiftStreamSnippet = `func handlePromptStream(userInput: String) async throws -> [String] {
    let templateVariables = ["userInput": userInput]
    let stream = try client.requestStream(templateVariables)

    var chunks: [String] = []
    for try await response in stream {
        chunks.append(response.content)
    }

    return chunks
}

let chunks = try await handlePromptStream("Hello World!")
`;

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
	'<API_KEY>',
	"CONFIG_ID",
);`;

const dartDefaultInitSnippet = `import 'package:basemind/client.dart';
import * as url from 'url';

final client = BaseMindClient('<API_KEY>');`;

const dartRequestSnippet = `Future<String> handlePromptRequest(String userInput) async {
	final templateVariables = {'userInput': userInput};
	final response = await client.requestPrompt(templateVariables);

	return response.content;
}

final prompt = await handlePromptRequest('Hello World!');
`;

const dartStreamSnippet = `handlePromptStream(String userInput,) {
  final stream = client.requestStream({'userInput': userInput});
  stream.listen((response) {
    print(response.content);
  });
}

handlePromptStream('Hello World!');
`;

// ---

const tabs: FrameworkTab[] = [
	{
		docs: kotlinDocs,
		framework: 'Android',
		isActive: true,
		language: 'kotlin',
	},
	{ docs: swiftDocs, framework: 'iOS', isActive: true, language: 'swift' },
	{
		docs: dartDocs,
		framework: 'Flutter',
		isActive: true,
		language: 'dart',
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
						: dartInitSnippet.replaceAll(
								'CONFIG_ID',
								promptConfigId,
							)
				}
				language="dart"
				allowCopy={true}
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
						: kotlinInitSnippet.replaceAll(
								'CONFIG_ID',
								promptConfigId,
							)
				}
				language="kotlin"
				allowCopy={true}
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
						: swiftInitSnippet.replaceAll(
								'CONFIG_ID',
								promptConfigId,
							)
				}
				language="swift"
				allowCopy={true}
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
		/>
	)),
	kotlin: memo(() => (
		<CodeSnippet
			codeText={kotlinInstallationSnippet}
			language="kotlin"
			allowCopy={true}
		/>
	)),
	swift: memo(() => (
		<CodeSnippet
			codeText={swiftInstallationSnippet}
			language="swift"
			allowCopy={true}
		/>
	)),
};

const promptRequestSnippetMap: Record<supportedLanguages, React.FC> = {
	dart: memo(() => (
		<CodeSnippet
			codeText={dartRequestSnippet}
			language="dart"
			allowCopy={true}
		/>
	)),
	kotlin: memo(() => (
		<CodeSnippet
			codeText={kotlinRequestSnippet}
			language="kotlin"
			allowCopy={true}
		/>
	)),
	swift: memo(() => (
		<CodeSnippet
			codeText={swiftRequestSnippet}
			language="swift"
			allowCopy={true}
		/>
	)),
};

const promptStreamSnippetMap: Record<supportedLanguages, React.FC> = {
	dart: memo(() => (
		<CodeSnippet
			codeText={dartStreamSnippet}
			language="dart"
			allowCopy={true}
		/>
	)),
	kotlin: memo(() => (
		<CodeSnippet
			codeText={kotlinStreamSnippet}
			language="kotlin"
			allowCopy={true}
		/>
	)),
	swift: memo(() => (
		<CodeSnippet
			codeText={swiftStreamSnippet}
			language="swift"
			allowCopy={true}
		/>
	)),
};

export function PromptConfigCodeSnippet({
	isDefaultConfig,
	promptConfigId,
}: {
	isDefaultConfig: boolean;
	promptConfigId: string;
}) {
	const t = useTranslations('configCodeSnippet');
	const { initialized, track } = useAnalytics();

	const [selectedFramework, setSelectedFramework] = useState('Android');

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

	return (
		<>
			<h2 className="card-header">{t('implement')}</h2>
			<div
				className="tabs tabs-lifted mt-3.5"
				data-testid="prompt-code-snippet-container"
			>
				{tabs.map((tab) => {
					const InstallationSnippet =
						installationSnippetMap[tab.language];
					const ImportSnippet = importSnippetMap[tab.language];
					const RequestSnippet =
						promptRequestSnippetMap[tab.language];
					const StreamSnippet = promptStreamSnippetMap[tab.language];

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
								<div className="flex flex-col">
									<button
										className="btn btn-sm btn-wide btn-neutral mb-5"
										disabled={!tab.docs}
										onClick={handleDocClick(tab)}
										data-testid={`code-snippet-view-docs-button-${tab.language}`}
									>
										<Github className="w-4 h-4" />
										<span className="text-sm">
											{t('documentation')}
										</span>
									</button>
									<div className="sm:flex sm:flex-col md:grid md:grid-cols-2 sm:gap-4 md:gap-8">
										<div className="flex flex-col gap-2">
											<div className="pb-2 flex items-center gap-2">
												<span className="badge badge-outline badge-info text-xl font-bold">
													1
												</span>
												<span
													className="text-info font-bold
												"
												>
													{t(
														`${tab.language}InstallationText`,
													)}
												</span>
											</div>
											<InstallationSnippet />
										</div>
										<div className="flex flex-col gap-2">
											<div className="pb-2 flex items-center gap-2">
												<span className="badge badge-outline badge-info text-xl font-bold">
													2
												</span>
												<span
													className="text-info font-bold
												"
												>
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
												<span className="badge badge-outline badge-info text-xl font-bold">
													3
												</span>
												<span
													className="text-info font-bold
												"
												>
													{t('usageRequestText')}
												</span>
											</div>
											<RequestSnippet />
										</div>
										<div className="flex flex-col gap-2">
											<div className="pb-2 flex items-center gap-2">
												<span className="badge badge-outline badge-info text-xl font-bold">
													4
												</span>
												<span
													className="text-info font-bold
												"
												>
													{t('usageStreamText')}
												</span>
											</div>
											<StreamSnippet />
										</div>
									</div>
								</div>
							</div>
						</Fragment>
					);
				})}
			</div>
		</>
	);
}

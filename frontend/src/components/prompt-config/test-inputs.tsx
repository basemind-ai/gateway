import { useTranslations } from 'next-intl';
import { Dispatch, SetStateAction } from 'react';

import {
	OpenAIModelParameters,
	OpenAIPromptMessage,
	PromptConfigTest,
} from '@/types';
import { handleChange } from '@/utils/helpers';

export default function TestInputs({
	templateVariables,
	setConfig,
	handleRunTest,
}: {
	handleRunTest: () => void;
	setConfig: Dispatch<
		SetStateAction<
			PromptConfigTest<OpenAIModelParameters, OpenAIPromptMessage>
		>
	>;
	templateVariables: Record<string, string>;
}) {
	const t = useTranslations('promptTesting');
	const variablesKeys = Object.keys(templateVariables);
	function onVariableChange(key: string) {
		return (value: string) => {
			setConfig((prev) => ({
				...prev,
				templateVariables: {
					...prev.templateVariables,
					[key]: value,
				},
			}));
		};
	}
	return (
		<div
			className="custom-card-px-16 flex flex-col gap-2"
			data-testid="test-inputs-card"
		>
			{variablesKeys.length === 0 && (
				<div className="w-full text-center mb-8">
					<p className="text-neutral-content">
						{t('noVariablesHeadline')}
					</p>
				</div>
			)}
			{variablesKeys.map((variable) => (
				<div key={variable}>
					<label
						htmlFor={variable}
						className="text-base-content label label-text"
					>
						{variable}
					</label>
					<textarea
						id={variable}
						className="textarea textarea-xs bg-neutral w-full"
						data-testid={`test-textarea-${variable}`}
						value={templateVariables[variable]}
						onChange={handleChange(onVariableChange(variable))}
					/>
				</div>
			))}
			<button
				className="btn btn-sm btn-accent self-end"
				onClick={handleRunTest}
				data-testid="test-cta-run"
			>
				{t('runTest')}
			</button>
		</div>
	);
}

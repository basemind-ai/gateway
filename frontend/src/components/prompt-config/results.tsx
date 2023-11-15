import { useTranslations } from 'next-intl';
import { ArrowRepeat } from 'react-bootstrap-icons';

import { PromptConfigTest, PromptConfigTestResultChunk } from '@/types';

export default function Results({
	handleRunTest,
	result,
	testConfig,
}: {
	handleRunTest: () => void;
	result: PromptConfigTestResultChunk[];
	testConfig: PromptConfigTest<any, any> | null;
}) {
	const t = useTranslations('promptTesting');
	return (
		<div
			className="custom-card-px-16 flex flex-col gap-2 content-center min-h-[400px]"
			data-testid={'results-card'}
		>
			{testConfig ? (
				<div
					data-testid="post-run-card"
					className="flex flex-col flex-grow bg-base-300 w-full rounded-4xl border border-neutral"
				>
					<div className="flex justify-between w-full border-b px-8 py-4 border-b-neutral">
						<div className="flex gap-4 items-center">
							<h3 className="text-lg font-medium text-base-content">
								{t('results')}
							</h3>
							<span>{testConfig.modelType}</span>
						</div>
						<button
							data-testid="button-repeat-test"
							className="btn btn-sm btn-square btn-outline border-neutral"
							onClick={handleRunTest}
						>
							<ArrowRepeat />
						</button>
					</div>
					<div className="flex flex-grow px-8 py-4">
						<p className="text-sm">
							{result.map((message) => message.content).join(' ')}
						</p>
					</div>
				</div>
			) : (
				<div className="flex flex-grow bg-base-300 w-full  rounded-4xl border border-neutral justify-center items-center">
					<div className="flex items-center p-6 flex-col gap-4">
						<button
							className="btn bg-neutral-content text-neutral"
							data-testid="result-run-test"
							onClick={handleRunTest}
						>
							{t('runTest')}
						</button>
						<p className="text-neutral-content text-xs text-center">
							{t('runTestExplaining1')}
							<br />
							{t('runTestExplaining2')}
						</p>
					</div>
				</div>
			)}
		</div>
	);
}

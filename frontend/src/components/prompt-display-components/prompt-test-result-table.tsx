/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
import { useTranslations } from 'next-intl';

import {
	modelTypeToLocaleMap,
	modelVendorToLocaleMap,
} from '@/constants/models';
import { ModelType, ModelVendor, PromptTestRecord } from '@/types';

export function PromptTestResultTable<T extends ModelVendor>({
	modelVendor,
	modelType,
	testFinishReason,
	testRecord,
}: {
	modelType: ModelType<T>;
	modelVendor: T;
	testFinishReason?: string;
	testRecord: PromptTestRecord<T> | null;
}) {
	const t = useTranslations('createConfigWizard');

	return (
		<div data-testid="prompt-test-result-table">
			<h2 className="card-header">{t('testResults')}</h2>
			<div className="rounded-data-card">
				<table className="custom-table w-full mb-5">
					<thead>
						<tr>
							<th>{t('modelVendor')}</th>
							<th>{t('modelType')}</th>
							<th>{t('finishReason')}</th>
							<th>{t('duration')}</th>
							<th>{t('requestTokens')}</th>
							<th>{t('requestTokensCost')}</th>
							<th>{t('responseTokens')}</th>
							<th>{t('responseTokensCost')}</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td data-testid="test-model-vendor-display">
								{modelVendorToLocaleMap[modelVendor]}
							</td>
							<td data-testid="test-model-type-display">
								{modelTypeToLocaleMap[modelType]}
							</td>
							<td data-testid="test-finish-reason-display">
								{testFinishReason || 'N/A'}
							</td>
							<td data-testid="test-duration-display">
								{`${Math.abs(testRecord?.durationMs ?? 0)} MS`}
							</td>
							<td data-testid="test-request-tokens-display">
								{testRecord ? testRecord.requestTokens : 0}
							</td>
							<td data-testid="test-request-tokens-cost-display">
								{testRecord ? testRecord.requestTokensCost : 0}
							</td>
							<td data-testid="test-response-tokens-display">
								{testRecord ? testRecord.responseTokens : 0}
							</td>
							<td data-testid="test-response-tokens-cost-display">
								{testRecord ? testRecord.responseTokensCost : 0}
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	);
}

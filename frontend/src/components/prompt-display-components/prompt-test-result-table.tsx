/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
import { useTranslations } from 'next-intl';
import { StreamFinishReason } from 'shared/constants';

import { TooltipIcon } from '@/components/input-label-with-tooltip';
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
	testFinishReason?: StreamFinishReason | null;
	testRecord: PromptTestRecord<T> | null;
}) {
	const t = useTranslations('createConfigWizard');
	const vendorLocale = modelVendorToLocaleMap[modelVendor];
	const typeLocale = modelTypeToLocaleMap[modelType];
	const {
		requestTokens = 0,
		requestTokensCost = '0',
		responseTokens = 0,
		responseTokensCost = '0',
		durationMs = 0,
	} = testRecord ?? {};

	const duration = Math.abs(durationMs);

	return (
		<div data-testid="prompt-test-result-table">
			<table className="table w-full mb-5 text-xs">
				<thead>
					<tr>
						<th>{t('modelVendor')}</th>
						<th>{t('modelType')}</th>
						<th>{t('finishReason')}</th>
						<th>
							<div className="flex gap-2 content-center justify-center">
								{t('duration')}{' '}
								<TooltipIcon
									dataTestId="durationTooltip"
									tooltip={t('durationTooltip')}
								/>
							</div>
						</th>
						<th className="hidden lg:table-cell">
							{t('requestTokens')}
						</th>
						<th className="hidden md:table-cell">
							{t('requestTokensCost')}
						</th>
						<th className="hidden lg:table-cell">
							{t('responseTokens')}
						</th>
						<th className="hidden md:table-cell">
							{t('responseTokensCost')}
						</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td data-testid="test-model-vendor-display">
							{vendorLocale}
						</td>
						<td data-testid="test-model-type-display">
							{typeLocale}
						</td>
						<td data-testid="test-finish-reason-display">
							{testFinishReason || 'N/A'}
						</td>
						<td data-testid="test-duration-display">{`${duration} MS`}</td>
						<td
							data-testid="test-request-tokens-display"
							className="hidden lg:table-cell"
						>
							{requestTokens}
						</td>
						<td
							data-testid="test-request-tokens-cost-display"
							className="hidden md:table-cell"
						>
							{requestTokensCost}
						</td>
						<td
							data-testid="test-response-tokens-display"
							className="hidden lg:table-cell"
						>
							{responseTokens}
						</td>
						<td
							data-testid="test-response-tokens-cost-display"
							className="hidden md:table-cell"
						>
							{responseTokensCost}
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	);
}

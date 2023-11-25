import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';

import {
	modelTypeToLocaleMap,
	modelVendorToLocaleMap,
} from '@/constants/models';
import { ModelVendor, PromptConfig } from '@/types';

function GridCell({
	header,
	content,
	dataTestId,
}: {
	content: string;
	dataTestId: string;
	header: string;
}) {
	return (
		<div className="p-2">
			<label className="text-sm">{header}</label>
			<p data-testid={dataTestId} className="text-sm font-semibold">
				{content}
			</p>
		</div>
	);
}

export function PromptConfigGeneralInfo<T extends ModelVendor>({
	promptConfig,
}: {
	promptConfig?: PromptConfig<T>;
}) {
	const t = useTranslations('promptConfig');

	if (!promptConfig) {
		return null;
	}

	return (
		<div data-testid="prompt-general-info-container">
			<h2 className="card-header">{t('general')}</h2>
			<div className="rounded-data-card flex flex-col">
				<div className="text-neutral-content grid grid-cols-3 gap-4">
					<GridCell
						header={t('modelVendor')}
						content={
							modelVendorToLocaleMap[promptConfig.modelVendor]
						}
						dataTestId="prompt-general-info-model-vendor"
					/>
					<GridCell
						header={t('modelType')}
						content={modelTypeToLocaleMap[promptConfig.modelType]}
						dataTestId="prompt-general-info-model-type"
					/>
					<GridCell
						header={t('id')}
						content={promptConfig.id}
						dataTestId="prompt-general-info-id"
					/>
					<GridCell
						header={t('isDefaultConfig')}
						content={promptConfig.isDefault?.toString() ?? ''}
						dataTestId="prompt-general-info-is-default"
					/>
					<GridCell
						header={t('createdAt')}
						content={dayjs(promptConfig.createdAt).format(
							'YYYY-MM-DD',
						)}
						dataTestId="prompt-general-info-created-at"
					/>
					<GridCell
						header={t('updatedAt')}
						content={dayjs(promptConfig.updatedAt).format(
							'YYYY-MM-DD',
						)}
						dataTestId="prompt-general-info-updated-at"
					/>
				</div>
			</div>
		</div>
	);
}

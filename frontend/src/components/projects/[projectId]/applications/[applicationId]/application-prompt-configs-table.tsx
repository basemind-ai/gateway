import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { PencilFill, Search } from 'react-bootstrap-icons';

import { Navigation, PromptConfigPageTab } from '@/constants';
import {
	modelTypeToLocaleMap,
	modelVendorToLocaleMap,
} from '@/constants/models';
import { ModelVendor, PromptConfig } from '@/types';
import { setRouteParams } from '@/utils/navigation';

export function ApplicationPromptConfigsTable({
	promptConfigs,
	projectId,
	applicationId,
}: {
	applicationId: string;
	projectId: string;
	promptConfigs: PromptConfig<any>[];
}) {
	const t = useTranslations('application');
	const router = useRouter();

	const pushToTab = ({
		promptConfigId,
		tab,
	}: {
		promptConfigId: string;
		tab: PromptConfigPageTab;
	}) => {
		router.push(
			setRouteParams(
				Navigation.PromptConfigDetail,
				{
					applicationId,
					projectId,
					promptConfigId,
				},
				tab as unknown as string,
			),
		);
	};

	return (
		<table
			className="table mb-4"
			data-testid="application-prompt-configs-table-container"
		>
			<thead>
				<tr>
					<th>{t('name')}</th>
					<th>{t('vendor')}</th>
					<th>{t('model')}</th>
					<th>{t('test')}</th>
					<th>{t('edit')}</th>
				</tr>
			</thead>
			<tbody>
				{promptConfigs.map(
					({
						name,
						modelType,
						modelVendor,
						id: promptConfigId,
						isDefault,
					}) => (
						<tr
							key={promptConfigId}
							data-testid="application-prompt-configs-table-row"
						>
							<td>
								<button
									data-testid="application-prompt-configs-table-config-name-button"
									className="btn-link"
									onClick={() => {
										pushToTab({
											promptConfigId,
											tab: PromptConfigPageTab.OVERVIEW,
										});
									}}
								>
									<span>
										{isDefault
											? `${name} (${t('defaultConfig')})`
											: name}
									</span>
								</button>
							</td>
							<td>
								<span className="text-info">
									{
										modelVendorToLocaleMap[
											modelVendor as ModelVendor
										]
									}
								</span>
							</td>
							<td>
								<span className="text-info">
									{modelTypeToLocaleMap[modelType]}
								</span>
							</td>
							<td>
								<button
									data-testid="application-prompt-configs-table-config-test-button"
									onClick={() => {
										pushToTab({
											promptConfigId,
											tab: PromptConfigPageTab.TESTING,
										});
									}}
								>
									<Search className="w-3.5 h-3.5 text-secondary" />
								</button>
							</td>
							<td>
								<button
									data-testid="application-prompt-configs-table-config-edit-button"
									onClick={() => {
										pushToTab({
											promptConfigId,
											tab: PromptConfigPageTab.SETTINGS,
										});
									}}
								>
									<PencilFill className="w-3.5 h-3.5 text-secondary" />
								</button>
							</td>
						</tr>
					),
				)}
			</tbody>
		</table>
	);
}

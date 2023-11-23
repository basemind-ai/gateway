import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CheckCircle, Front, PencilFill, Search } from 'react-bootstrap-icons';

import { PromptConfigPageTab } from '@/app/[locale]/projects/[projectId]/applications/[applicationId]/configs/[promptConfigId]/page';
import { Navigation } from '@/constants';
import { modelTypeToNameMap, modelVendorToLocaleMap } from '@/constants/models';
import { ModelVendor, PromptConfig } from '@/types';
import { setRouteParams } from '@/utils/navigation';

export function ApplicationPromptConfigsTable({
	promptConfigs,
	projectId,
	applicationId,
	handlePromptConfigIdCopy,
}: {
	applicationId: string;
	handlePromptConfigIdCopy: (promptConfigId: string) => void;
	projectId: string;
	promptConfigs: PromptConfig<any>[];
}) {
	const t = useTranslations('application');
	const router = useRouter();

	const pustToTab = ({
		promptConfigId,
		tab,
	}: {
		promptConfigId: string;
		tab: PromptConfigPageTab;
	}) => {
		router.push(
			`${setRouteParams(
				Navigation.PromptConfigDetail,
				{
					applicationId,
					projectId,
					promptConfigId,
				},
				tab as unknown as string,
			)}`,
		);
	};

	return (
		<table
			className="custom-table mb-16"
			data-testid="application-prompt-configs-table-container"
		>
			<thead>
				<tr>
					<th>{t('default')}</th>
					<th>{t('name')}</th>
					<th>{t('vendor')}</th>
					<th>{t('model')}</th>
					<th>ID</th>
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
								<div className="pl-3">
									{isDefault ? (
										<CheckCircle className="w-3.5 h-3.5 text-secondary" />
									) : null}
								</div>
							</td>
							<td>
								<button
									data-testid="application-prompt-configs-table-config-name-button"
									className="btn-link text-secondary"
									onClick={() => {
										pustToTab({
											promptConfigId,
											tab: PromptConfigPageTab.OVERVIEW,
										});
									}}
								>
									{name}
								</button>
							</td>
							<td>
								{
									modelVendorToLocaleMap[
										modelVendor as ModelVendor
									]
								}
							</td>
							<td>{modelTypeToNameMap[modelType]}</td>
							<td>
								<button
									data-testid="application-prompt-configs-table-config-id-copy-button"
									onClick={() => {
										handlePromptConfigIdCopy(
											promptConfigId,
										);
									}}
								>
									<Front className="w-3.5 h-3.5 text-secondary" />
								</button>
							</td>
							<td>
								<button
									data-testid="application-prompt-configs-table-config-test-button"
									onClick={() => {
										pustToTab({
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
										pustToTab({
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

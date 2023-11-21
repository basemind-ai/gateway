import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Front, PencilFill, Search } from 'react-bootstrap-icons';

import { Navigation } from '@/constants';
import { modelTypeToNameMap, modelVendorToLocaleMap } from '@/constants/models';
import { ModelVendor, PromptConfig } from '@/types';
import { setPathParams } from '@/utils/navigation';

export function ApplicationPromptConfigsTable({
	promptConfigs,
	projectId,
	applicationId,
	handleEditPromptConfig,
	handlePromptConfigIdCopy,
}: {
	applicationId: string;
	handleEditPromptConfig: (promptConfigId: string) => void;
	handlePromptConfigIdCopy: (promptConfigId: string) => void;
	projectId: string;
	promptConfigs: PromptConfig<any>[];
}) {
	const t = useTranslations('application');
	const router = useRouter();

	return (
		<table
			className="custom-table mb-16"
			data-testid="application-prompt-configs-table-container"
		>
			<thead>
				<tr>
					<th>{t('name')}</th>
					<th>{t('type')}</th>
					<th>{t('model')}</th>
					<th>ID</th>
					<th>{t('test')}</th>
					<th>{t('edit')}</th>
				</tr>
			</thead>
			<tbody>
				{promptConfigs.map(
					({ name, modelType, modelVendor, id: promptConfigId }) => (
						<tr
							key={promptConfigId}
							data-testid="application-prompt-configs-table-row"
						>
							<td>
								<button
									data-testid="application-prompt-configs-table-config-name-button"
									className="btn-link"
									onClick={() => {
										router.push(
											setPathParams(
												Navigation.PromptConfigDetail,
												{
													applicationId,
													projectId,
													promptConfigId,
												},
											),
										);
									}}
								>
									{name}
								</button>
							</td>
							<td>{modelTypeToNameMap[modelType]}</td>
							<td>
								{
									modelVendorToLocaleMap[
										modelVendor as ModelVendor
									]
								}
							</td>
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
								<button>
									<Search className="w-3.5 h-3.5 text-secondary" />
								</button>
							</td>
							<td>
								<button
									data-testid="application-prompt-configs-table-config-edit-button"
									onClick={() => {
										handleEditPromptConfig(promptConfigId);
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

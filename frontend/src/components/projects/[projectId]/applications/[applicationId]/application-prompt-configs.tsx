import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Front, PencilFill, Plus, Search } from 'react-bootstrap-icons';
import useSWR from 'swr';

import { handleRetrievePromptConfigs } from '@/api';
import { Navigation } from '@/constants';
import { modelTypeToNameMap, modelVendorToLocaleMap } from '@/constants/models';
import { ApiError } from '@/errors';
import { usePromptConfigs, useSetPromptConfigs } from '@/stores/api-store';
import { useShowError, useShowSuccess } from '@/stores/toast-store';
import { ModelVendor, PromptConfig } from '@/types';
import { copyToClipboard } from '@/utils/helpers';
import { setPathParams } from '@/utils/navigation';

export function ApplicationPromptConfigs({
	projectId,
	applicationId,
}: {
	applicationId: string;
	projectId: string;
}) {
	const t = useTranslations('application');
	const router = useRouter();

	const setPromptConfig = useSetPromptConfigs();
	const promptConfigs = usePromptConfigs();

	const showError = useShowError();
	const showSuccess = useShowSuccess();

	const { isLoading } = useSWR(
		{
			applicationId,
			projectId,
		},
		handleRetrievePromptConfigs,
		{
			/* c8 ignore start */
			onError({ message }: ApiError) {
				showError(message);
			},
			/* c8 ignore end */
			onSuccess(promptConfigRes) {
				setPromptConfig(applicationId, promptConfigRes);
			},
		},
	);

	const editPromptConfig = (promptConfigId: string) => {
		router.push(
			setPathParams(Navigation.PromptConfigDetail, {
				applicationId,
				projectId,
				promptConfigId,
			}),
		);
	};

	return (
		<div data-testid="application-prompt-config-container" className="mt-9">
			<h2 className="font-semibold text-base-content text-xl">
				{t('promptConfiguration')}
			</h2>
			<div className="custom-card">
				{isLoading ? (
					<div className="w-full flex mb-8">
						<span className="loading loading-bars mx-auto" />
					</div>
				) : (
					<ApplicationPromptConfigsTable
						applicationId={applicationId}
						promptConfigs={promptConfigs[applicationId] ?? []}
						projectId={projectId}
						handleEditPromptConfig={editPromptConfig}
						handlePromptConfigIdCopy={(promptConfigId: string) => {
							copyToClipboard(promptConfigId);
							showSuccess(t('copiedToClipboard'));
						}}
					/>
				)}
				<button
					className="flex gap-2 items-center text-secondary hover:brightness-90"
					onClick={() => {
						router.push(
							setPathParams(Navigation.ConfigCreateWizard, {
								applicationId,
								projectId,
							}),
						);
					}}
				>
					<Plus className="text-secondary w-4 h-4 hover:brightness-90" />
					<span>{t('newConfiguration')}</span>
				</button>
			</div>
		</div>
	);
}

function ApplicationPromptConfigsTable({
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

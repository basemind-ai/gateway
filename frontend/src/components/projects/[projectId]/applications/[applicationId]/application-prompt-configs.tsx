import { useTranslations } from 'next-intl';
import { Front, PencilFill, Plus, Search } from 'react-bootstrap-icons';
import useSWR from 'swr';

import { handleRetrievePromptConfigs } from '@/api';
import { ApiError } from '@/errors';
import { usePromptConfig, useSetPromptConfig } from '@/stores/project-store';
import { useShowError, useShowSuccess } from '@/stores/toast-store';
import { copyToClipboard } from '@/utils/helpers';

export function ApplicationPromptConfigs({
	projectId,
	applicationId,
}: {
	projectId: string;
	applicationId: string;
}) {
	const t = useTranslations('application');
	const setPromptConfig = useSetPromptConfig();
	const promptConfigs = usePromptConfig();

	const showError = useShowError();
	const showSuccess = useShowSuccess();

	const { isLoading } = useSWR(
		{
			applicationId,
			projectId,
		},
		handleRetrievePromptConfigs,
		{
			onError({ message }: ApiError) {
				showError(message);
			},
			onSuccess(promptConfigRes) {
				setPromptConfig(applicationId, promptConfigRes);
			},
		},
	);

	function renderPromptConfigs() {
		if (isLoading) {
			return (
				<div className="w-full flex mb-8">
					<span className="loading loading-bars mx-auto" />
				</div>
			);
		}

		return (
			<table className="custom-table mb-16">
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
					{promptConfigs[applicationId]?.map(
						({ name, modelType, modelVendor, id }) => (
							<tr key={id}>
								<td>{name}</td>
								<td>{modelType}</td>
								<td>{modelVendor}</td>
								<td>
									<button
										data-testid="prompt-config-copy-btn"
										onClick={() => {
											copyToClipboard(id);
											showSuccess(t('copiedToClipboard'));
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
									<button>
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

	return (
		<div data-testid="application-prompt-config-container" className="mt-9">
			<h2 className="font-semibold text-white text-xl	">
				{t('promptConfiguration')}
			</h2>
			<div className="custom-card">
				{renderPromptConfigs()}
				<button className="flex gap-2 items-center text-secondary hover:brightness-90">
					<Plus className="text-secondary w-4 h-4 hover:brightness-90" />
					<span>{t('newConfiguration')}</span>
				</button>
			</div>
		</div>
	);
}

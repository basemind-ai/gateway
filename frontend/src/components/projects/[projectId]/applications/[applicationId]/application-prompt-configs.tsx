import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Front, PencilFill, Plus, Search } from 'react-bootstrap-icons';
import useSWR from 'swr';

import { handleRetrievePromptConfigs } from '@/api';
import { Navigation } from '@/constants';
import { ApiError } from '@/errors';
import { usePromptConfigs, useSetPromptConfigs } from '@/stores/api-store';
import { useShowError, useShowSuccess } from '@/stores/toast-store';
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

	const editPromptConfig = (configId: string) => {
		router.push(
			setPathParams(Navigation.PromptConfigDetail, {
				applicationId,
				configId,
				projectId,
			}),
		);
	};

	const PromptConfigTable = () => (
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
								<button
									data-testid="application-edit-prompt-button"
									onClick={() => {
										editPromptConfig(id);
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
					<PromptConfigTable />
				)}
				<button className="flex gap-2 items-center text-secondary hover:brightness-90">
					<Plus className="text-secondary w-4 h-4 hover:brightness-90" />
					<span>{t('newConfiguration')}</span>
				</button>
			</div>
		</div>
	);
}

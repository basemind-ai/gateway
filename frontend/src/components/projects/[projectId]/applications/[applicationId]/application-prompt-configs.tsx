import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Plus } from 'react-bootstrap-icons';
import useSWR from 'swr';

import { handleRetrievePromptConfigs } from '@/api';
import { ApplicationPromptConfigsTable } from '@/components/projects/[projectId]/applications/[applicationId]/application-prompt-configs-table';
import { Navigation } from '@/constants';
import { useHandleError } from '@/hooks/use-handle-error';
import { usePromptConfigs, useSetPromptConfigs } from '@/stores/api-store';
import { useShowSuccess } from '@/stores/toast-store';
import { Application } from '@/types';
import { copyToClipboard } from '@/utils/helpers';
import { setRouteParams } from '@/utils/navigation';

export function ApplicationPromptConfigs({
	projectId,
	application,
}: {
	application: Application;
	projectId: string;
}) {
	const t = useTranslations('application');
	const router = useRouter();

	const setPromptConfigs = useSetPromptConfigs();
	const promptConfigs = usePromptConfigs();

	const handleError = useHandleError();
	const showSuccess = useShowSuccess();

	const { isLoading } = useSWR(
		{
			applicationId: application.id,
			projectId,
		},
		handleRetrievePromptConfigs,
		{
			onError: handleError,
			onSuccess(promptConfigRes) {
				setPromptConfigs(application.id, promptConfigRes);
			},
		},
	);

	return (
		<div data-testid="application-prompt-config-container" className="mt-9">
			<h2 className="font-semibold text-base-content text-xl">
				{t('promptConfiguration')}
			</h2>
			<div className="rounded-data-card">
				{isLoading ? (
					<div className="w-full flex mb-8">
						<span className="loading loading-bars mx-auto" />
					</div>
				) : (
					<ApplicationPromptConfigsTable
						applicationId={application.id}
						promptConfigs={promptConfigs[application.id] ?? []}
						projectId={projectId}
						handlePromptConfigIdCopy={(promptConfigId: string) => {
							copyToClipboard(promptConfigId);
							showSuccess(t('copiedToClipboard'));
						}}
					/>
				)}
				<button
					className="flex gap-2 items-center text-secondary hover:brightness-90"
					data-testid="application-prompt-config-new-prompt-config-button"
					onClick={() => {
						router.push(
							setRouteParams(Navigation.ConfigCreateWizard, {
								applicationId: application.id,
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

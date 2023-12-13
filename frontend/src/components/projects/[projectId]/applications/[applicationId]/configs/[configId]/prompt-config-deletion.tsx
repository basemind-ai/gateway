import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { handleDeletePromptConfig } from '@/api';
import { Modal } from '@/components/modal';
import { ResourceDeletionBanner } from '@/components/resource-deletion-banner';
import { Navigation } from '@/constants';
import { useHandleError } from '@/hooks/use-handle-error';
import { useDeletePromptConfig } from '@/stores/api-store';
import { useShowInfo } from '@/stores/toast-store';
import { ModelVendor, PromptConfig } from '@/types';
import { setRouteParams } from '@/utils/navigation';

export function PromptConfigDeletion<T extends ModelVendor>({
	projectId,
	applicationId,
	promptConfig,
}: {
	applicationId: string;
	projectId: string;
	promptConfig: PromptConfig<T>;
}) {
	const router = useRouter();
	const t = useTranslations('promptConfig');

	const deletePromptConfig = useDeletePromptConfig();

	const handleError = useHandleError();
	const showInfo = useShowInfo();

	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	async function deletePrompt() {
		try {
			setIsLoading(true);
			await handleDeletePromptConfig({
				applicationId,
				projectId,
				promptConfigId: promptConfig.id,
			});
			deletePromptConfig(applicationId, promptConfig.id);
			router.replace(
				setRouteParams(Navigation.ApplicationDetail, {
					applicationId,
					projectId,
				}),
			);
			showInfo(t('promptDeleted'));
		} catch (e) {
			handleError(e);
		} finally {
			setIsDeleteModalOpen(false);
			setIsLoading(false);
		}
	}

	return (
		<div data-testid="prompt-deletion-container" className="card-divider">
			<h2 className="card-header">{t('modelConfigDeletion')}</h2>
			<div className="rounded-data-card flex items-center justify-between text-neutral-content">
				<div>
					<h6 className="font-medium ">
						{t('deleteModelConfigTitle')}
					</h6>
					<p className="font-light text-sm mt-2.5">
						{t('deleteModelConfigDescription')}
					</p>
				</div>
				<button
					data-testid="prompt-delete-btn"
					className="card-action-button btn-error text-error-content disabled:text-neutral"
					disabled={isLoading}
					onClick={() => {
						setIsDeleteModalOpen(true);
					}}
				>
					{t('delete')}
				</button>
				<Modal modalOpen={isDeleteModalOpen}>
					<ResourceDeletionBanner
						title={t('warning')}
						description={t('deleteModelConfigDescription')}
						placeholder={t('deletionPlaceholder')}
						resourceName={promptConfig.name}
						onCancel={() => {
							setIsDeleteModalOpen(false);
						}}
						isDisabled={isLoading}
						onConfirm={() => void deletePrompt()}
						confirmCTA={
							isLoading ? (
								<span className="loading loading-spinner loading-xs mx-1.5" />
							) : undefined
						}
					/>
				</Modal>
			</div>
		</div>
	);
}

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { handleDeleteApplication } from '@/api';
import { Modal } from '@/components/modal';
import { ResourceDeletionBanner } from '@/components/resource-deletion-banner';
import { Navigation } from '@/constants';
import { useHandleError } from '@/hooks/use-handle-error';
import { useDeleteApplication } from '@/stores/api-store';
import { useShowInfo } from '@/stores/toast-store';
import { Application } from '@/types';

export function ApplicationDeletion({
	projectId,
	application,
}: {
	application: Application;
	projectId: string;
}) {
	const t = useTranslations('application');
	const router = useRouter();

	const deleteApplicationHook = useDeleteApplication();
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const handleError = useHandleError();
	const showInfo = useShowInfo();

	async function deleteApplication() {
		try {
			setIsLoading(true);

			await handleDeleteApplication({
				applicationId: application.id,
				projectId,
			});
			deleteApplicationHook(projectId, application.id);
			router.replace(Navigation.Projects);
			showInfo(t('applicationDeleted'));
		} catch (e) {
			handleError(e);
		} finally {
			setIsDeleteModalOpen(false);

			setIsLoading(false);
		}
	}

	return (
		<div
			data-testid="application-deletion-container"
			className="card-divider"
		>
			<h2 className="card-header">{t('deleteApplicationTitle')}</h2>
			<div className="rounded-data-card flex items-center justify-between text-neutral-content">
				<div>
					<h6 className="font-medium ">
						{t('deleteApplicationSubtitle')}
					</h6>
					<p className="font-light text-sm mt-2.5">
						{t('deleteApplicationWarning')}
					</p>
				</div>
				<button
					data-testid="application-delete-btn"
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
						title={t('warningTitleDeleteApplication')}
						description={t('warningMessageApplication')}
						placeholder={t('deletePlaceholderApplication')}
						resourceName={application.name}
						onCancel={() => {
							setIsDeleteModalOpen(false);
						}}
						onConfirm={() => void deleteApplication()}
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

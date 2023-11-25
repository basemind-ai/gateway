import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

import { handleDeleteApplication } from '@/api';
import { ResourceDeletionBanner } from '@/components/resource-deletion-banner';
import { Navigation } from '@/constants';
import { ApiError } from '@/errors';
import { useDeleteApplication } from '@/stores/api-store';
import { useShowError, useShowInfo } from '@/stores/toast-store';
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
	const dialogRef = useRef<HTMLDialogElement>(null);
	const [loading, setLoading] = useState(false);

	const showError = useShowError();
	const showInfo = useShowInfo();

	function openDeleteConfirmationPopup() {
		dialogRef.current?.showModal();
	}

	function closeDeleteConfirmationPopup() {
		dialogRef.current?.close();
	}

	async function deleteApplication() {
		/* c8 ignore start */
		if (loading) {
			return null;
		}
		/* c8 ignore end */

		try {
			setLoading(true);

			await handleDeleteApplication({
				applicationId: application.id,
				projectId,
			});
			deleteApplicationHook(projectId, application.id);
			router.replace(Navigation.Projects);
			showInfo(t('applicationDeleted'));
		} catch (e) {
			showError((e as ApiError).message);
		} finally {
			closeDeleteConfirmationPopup();
			setLoading(false);
		}
	}

	return (
		<div data-testid="application-deletion-container" className="mt-8">
			<h2 className="card-header">{t('deleteApplicationTitle')}</h2>
			<div className="rounded-data-card flex items-center justify-between text-neutral-content">
				<div>
					<h6 className="font-medium ">
						{t('deleteYourApplication')}
					</h6>
					<p className="font-light text-xs mt-2.5">
						{t('deleteApplicationWarning')}
					</p>
				</div>
				<button
					data-testid="application-delete-btn"
					className="btn bg-error text-accent-content py-2.5 px-4 rounded-3xl capitalize min-h-0 h-full leading-4"
					onClick={openDeleteConfirmationPopup}
				>
					{t('delete')}
				</button>
				<dialog ref={dialogRef} className="modal">
					<div className="dialog-box">
						<ResourceDeletionBanner
							title={t('warningTitleDeleteApplication')}
							description={t('warningMessageApplication')}
							placeholder={t('deletePlaceholderApplication')}
							resourceName={application.name}
							onCancel={closeDeleteConfirmationPopup}
							onConfirm={() => void deleteApplication()}
							confirmCTA={
								loading ? (
									<span className="loading loading-spinner loading-xs mx-1.5" />
								) : undefined
							}
						/>
					</div>
					<form method="dialog" className="modal-backdrop">
						<button />
					</form>
				</dialog>
			</div>
		</div>
	);
}

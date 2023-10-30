import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

import { handleDeleteApplication } from '@/api';
import { ResourceDeletionBanner } from '@/components/resource-deletion-banner';
import { Navigation } from '@/constants';
import { ApiError } from '@/errors';
import { useApplication, useDeleteApplication } from '@/stores/project-store';
import { useShowError, useShowInfo } from '@/stores/toast-store';

export function ApplicationDeletion({
	projectId,
	applicationId,
}: {
	projectId: string;
	applicationId: string;
}) {
	const t = useTranslations('application');
	const router = useRouter();
	const application = useApplication(projectId, applicationId);

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
		if (loading) {
			return;
		}

		try {
			setLoading(true);

			await handleDeleteApplication({ projectId, applicationId });
			deleteApplicationHook(projectId, applicationId);
			router.replace(Navigation.Projects);
			showInfo(t('applicationDeleted'));
		} catch (e) {
			showError((e as ApiError).message);
		} finally {
			closeDeleteConfirmationPopup();
			setLoading(false);
		}
	}

	if (!application) {
		return null;
	}

	return (
		<div data-testid="application-deletion-container" className="mt-8">
			<h2 className="font-semibold text-white text-xl">
				{t('applicationDeletion')}
			</h2>
			<div className="custom-card flex items-center justify-between text-neutral-content">
				<div>
					<h6 className="font-medium ">
						{t('deleteYourApplication')}
					</h6>
					<p className="font-light text-xs mt-2.5">
						{t('deleteYourApplicationMessage')}
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
					<div className="modal-box p-0 border border-neutral max-w-[43rem]">
						<ResourceDeletionBanner
							title={t('warning')}
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

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

import { handleDeleteProject } from '@/api';
import { ResourceDeletionBanner } from '@/components/resource-deletion-banner';
import { Navigation } from '@/constants';
import { useHandleError } from '@/hooks/use-handle-error';
import { useDeleteProject } from '@/stores/api-store';
import { useShowInfo } from '@/stores/toast-store';
import { Project } from '@/types';

export function ProjectDeletion({ project }: { project: Project }) {
	const router = useRouter();
	const t = useTranslations('projectSettings');
	const deleteProjectHook = useDeleteProject();

	const handleError = useHandleError();
	const showInfo = useShowInfo();

	const dialogRef = useRef<HTMLDialogElement>(null);
	const [loading, setLoading] = useState(false);

	function openDeleteConfirmationPopup() {
		dialogRef.current?.showModal();
	}

	function closeDeleteConfirmationPopup() {
		dialogRef.current?.close();
	}

	async function deleteProject() {
		/* c8 ignore start */
		if (loading) {
			return null;
		}
		/* c8 ignore end */

		try {
			setLoading(true);
			await handleDeleteProject({ projectId: project.id });
			deleteProjectHook(project.id);
			router.replace(Navigation.Projects);
			showInfo(t('projectDeleted'));
		} catch (e) {
			handleError(e);
		} finally {
			closeDeleteConfirmationPopup();
			setLoading(false);
		}
	}

	return (
		<div data-testid="project-deletion-container" className="mt-8">
			<h2 className="card-header">{t('deleteProjectTitle')}</h2>
			<div className="rounded-data-card flex items-center justify-between text-neutral-content">
				<div>
					<h6 className="font-medium ">{t('deleteProject')}</h6>
					<p className="font-light text-xs mt-2.5">
						{t('deleteProjectWarning')}
					</p>
				</div>
				<button
					data-testid="project-delete-btn"
					className="btn bg-error text-accent-content py-2.5 px-4 rounded-3xl capitalize min-h-0 h-full leading-4"
					onClick={openDeleteConfirmationPopup}
				>
					{t('delete')}
				</button>
				<dialog ref={dialogRef} className="modal">
					<div className="dialog-box">
						<ResourceDeletionBanner
							title={t('warning')}
							description={t('warningMessageProject')}
							placeholder={t('deletionPlaceholder')}
							resourceName={project.name}
							onCancel={closeDeleteConfirmationPopup}
							onConfirm={() => void deleteProject()}
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

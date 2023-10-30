import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

import { handleDeleteProject } from '@/api';
import { ResourceDeletionBanner } from '@/components/resource-deletion-banner';
import { Navigation } from '@/constants';
import { ApiError } from '@/errors';
import { useDeleteProject, useProject } from '@/stores/project-store';
import { useShowError, useShowInfo } from '@/stores/toast-store';

export function ProjectDeletion({ projectId }: { projectId: string }) {
	const router = useRouter();
	const t = useTranslations('projectSettings');
	const project = useProject(projectId);
	const deleteProjectHook = useDeleteProject();

	const showError = useShowError();
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
		if (loading) {
			return;
		}

		try {
			setLoading(true);
			await handleDeleteProject({ projectId });
			deleteProjectHook(projectId);
			router.replace(Navigation.Projects);
			showInfo(t('projectDeleted'));
		} catch (e) {
			showError((e as ApiError).message);
		} finally {
			closeDeleteConfirmationPopup();
			setLoading(false);
		}
	}

	if (!project) {
		return null;
	}

	return (
		<div data-testid="project-deletion-container" className="mt-8">
			<h2 className="font-semibold text-white text-xl">
				{t('projectDeletion')}
			</h2>
			<div className="custom-card flex items-center justify-between text-neutral-content">
				<div>
					<h6 className="font-medium ">{t('deleteProject')}</h6>
					<p className="font-light text-xs mt-2.5">
						{t('deleteProjectMessage')}
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
					<div className="modal-box p-0 border border-neutral max-w-[43rem]">
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

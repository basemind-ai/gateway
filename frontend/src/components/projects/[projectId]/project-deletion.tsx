import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { handleDeleteProject } from '@/api';
import { Modal } from '@/components/modal';
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

	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	async function deleteProject() {
		try {
			setIsLoading(true);
			await handleDeleteProject({ projectId: project.id });
			deleteProjectHook(project.id);
			router.replace(Navigation.Projects);
			showInfo(t('projectDeleted'));
		} catch (e) {
			handleError(e);
		} finally {
			setIsDeleteModalOpen(false);
			setIsLoading(false);
		}
	}

	return (
		<div data-testid="project-deletion-container" className="card-divider">
			<h2 className="card-header">{t('deleteProjectTitle')}</h2>
			<div className="rounded-data-card flex items-center justify-between text-neutral-content w-full">
				<div>
					<h6 className="text-base-content font-medium ">
						{t('deleteProjectSubtitle')}
					</h6>
					<p className="text-base-content font-light text-sm mt-2.5">
						{t('deleteProjectWarning')}
					</p>
				</div>
				<button
					data-testid="project-delete-btn"
					className="btn-sm btn btn-outline btn-error disabled:text-neutral"
					disabled={isLoading}
					onClick={() => {
						setIsDeleteModalOpen(true);
					}}
				>
					{t('delete')}
				</button>
			</div>
			<Modal modalOpen={isDeleteModalOpen}>
				<ResourceDeletionBanner
					title={t('warning')}
					description={t('warningMessageProject')}
					placeholder={t('deletionPlaceholder')}
					resourceName={project.name}
					isDisabled={isLoading}
					onCancel={() => {
						setIsDeleteModalOpen(false);
					}}
					onConfirm={() => void deleteProject()}
					confirmCTA={
						isLoading ? (
							<span className="loading loading-spinner loading-xs mx-1.5 text-base-content" />
						) : undefined
					}
				/>
			</Modal>
		</div>
	);
}

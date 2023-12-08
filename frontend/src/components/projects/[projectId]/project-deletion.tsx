import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { handleDeleteProject } from '@/api';
import { Modal } from '@/components/modal';
import { ResourceDeletionBanner } from '@/components/resource-deletion-banner';
import { Navigation } from '@/constants';
import { useHandleError } from '@/hooks/use-handle-error';
import { usePageTracking } from '@/hooks/use-page-tracking';
import { useDeleteProject } from '@/stores/api-store';
import { useShowInfo } from '@/stores/toast-store';
import { Project } from '@/types';

export function ProjectDeletion({ project }: { project: Project }) {
	usePageTracking('project-settings-deletion');
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
			<div className="rounded-data-card flex items-center justify-between text-neutral-content">
				<div>
					<h6 className="font-medium ">
						{t('deleteProjectSubtitle')}
					</h6>
					<p className="font-light text-sm mt-2.5">
						{t('deleteProjectWarning')}
					</p>
				</div>
				<button
					data-testid="project-delete-btn"
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
								<span className="loading loading-spinner loading-xs mx-1.5" />
							) : undefined
						}
					/>
				</Modal>
			</div>
		</div>
	);
}

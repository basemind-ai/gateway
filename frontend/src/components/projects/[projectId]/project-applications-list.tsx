import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Plus } from 'react-bootstrap-icons';
import useSWR from 'swr';

import { handleRetrieveApplications, handleRetrievePromptConfigs } from '@/api';
import { CardHeaderWithTooltip } from '@/components/card-header-with-tooltip';
import { Modal } from '@/components/modal';
import { CreateApplication } from '@/components/projects/[projectId]/applications/create-application';
import { ProjectApplicationsListTable } from '@/components/projects/[projectId]/project-applications-list-table';
import { useHandleError } from '@/hooks/use-handle-error';
import {
	useApplications,
	usePromptConfigs,
	useSetProjectApplications,
	useSetPromptConfigs,
} from '@/stores/api-store';
import { Project } from '@/types';

export function ProjectApplicationsList({ project }: { project: Project }) {
	const t = useTranslations('projectOverview');

	const applications = useApplications(project.id);
	const setProjectApplications = useSetProjectApplications();

	const promptConfigs = usePromptConfigs();
	const setPromptConfig = useSetPromptConfigs();
	const handleError = useHandleError();

	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

	const { isLoading } = useSWR(project.id, handleRetrieveApplications, {
		onError: handleError,
		onSuccess(data) {
			setProjectApplications(project.id, data);
		},
	});

	useSWR(
		() => applications,
		(applications) =>
			Promise.all(
				applications.map((application) =>
					handleRetrievePromptConfigs({
						applicationId: application.id,
						projectId: project.id,
					}),
				),
			),
		{
			onError: handleError,
			onSuccess(data) {
				for (const [index, promptConfig] of data.entries()) {
					setPromptConfig(applications![index].id, promptConfig);
				}
			},
		},
	);

	return (
		<div data-testid="project-application-list-container">
			<CardHeaderWithTooltip
				tooltipText={t('headlineTooltip')}
				headerText={t('applications')}
				dataTestId={t('applications')}
			/>
			<div className="rounded-data-card flex flex-col">
				{applications?.length ? (
					<ProjectApplicationsListTable
						projectId={project.id}
						applications={applications}
						promptConfigs={promptConfigs}
					/>
				) : isLoading ? (
					<div className="w-full flex mb-8">
						<span className="loading loading-bars mx-auto" />
					</div>
				) : null}
				<button
					data-testid="new-application-btn"
					onClick={() => {
						setIsCreateModalOpen(true);
					}}
					className="card-action-button-outline btn-primary"
				>
					<Plus className="w-4 h-4 hover:brightness-90" />
					<span>{t('newApplication')}</span>
				</button>
			</div>
			<Modal modalOpen={isCreateModalOpen}>
				<CreateApplication
					onClose={() => {
						setIsCreateModalOpen(false);
					}}
					projectId={project.id}
				/>
			</Modal>
		</div>
	);
}

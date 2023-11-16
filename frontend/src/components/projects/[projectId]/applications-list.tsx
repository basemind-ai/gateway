import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';
import { PencilFill, Plus } from 'react-bootstrap-icons';
import useSWR from 'swr';

import { handleRetrieveApplications, handleRetrievePromptConfigs } from '@/api';
import { CreateApplication } from '@/components/projects/[projectId]/applications/create-application';
import { Navigation } from '@/constants';
import { ApiError } from '@/errors';
import {
	useApplications,
	usePromptConfigs,
	useSetProjectApplications,
	useSetPromptConfigs,
} from '@/stores/api-store';
import { useShowError } from '@/stores/toast-store';
import { setApplicationId, setProjectId } from '@/utils/navigation';

export function ApplicationsList({ projectId }: { projectId: string }) {
	const t = useTranslations('projectOverview');
	const applications = useApplications(projectId);
	const setProjectApplications = useSetProjectApplications();

	const promptConfigs = usePromptConfigs();
	const setPromptConfig = useSetPromptConfigs();

	const dialogRef = useRef<HTMLDialogElement>(null);

	const showError = useShowError();

	const { isLoading } = useSWR(projectId, handleRetrieveApplications, {
		onError({ message }: ApiError) {
			showError(message);
		},
		onSuccess(data) {
			setProjectApplications(projectId, data);
		},
	});

	useSWR(
		() => applications,
		(applications) =>
			Promise.all(
				applications.map((application) =>
					handleRetrievePromptConfigs({
						applicationId: application.id,
						projectId,
					}),
				),
			),
		{
			onSuccess(data) {
				data.forEach((promptConfig, index) => {
					setPromptConfig(applications![index].id, promptConfig);
				});
			},
		},
	);

	function openAppCreateFlow() {
		dialogRef.current?.showModal();
	}

	function closeAppCreateFlow() {
		dialogRef.current?.close();
	}

	function renderTable() {
		if (isLoading && !applications?.length) {
			return (
				<div className="w-full flex mb-8">
					<span className="loading loading-bars mx-auto" />
				</div>
			);
		}
		if (!applications?.length) {
			return null;
		}

		return (
			<table className="custom-table mb-16">
				<thead>
					<tr>
						<th>{t('name')}</th>
						<th>{t('configs')}</th>
						<th>{t('edit')}</th>
					</tr>
				</thead>
				<tbody>
					{applications.map(({ name, id }) => {
						const applicationUrl = setApplicationId(
							setProjectId(Navigation.Applications, projectId),
							id,
						);
						return (
							<tr key={id}>
								<td>
									<Link
										data-testid="application-name-anchor"
										href={applicationUrl}
									>
										{name}
									</Link>
								</td>
								<td data-testid="application-prompt-config-count">
									{promptConfigs[id]?.length}
								</td>
								<td className="flex justify-center">
									<Link
										data-testid="application-edit-anchor"
										className="block"
										href={applicationUrl}
									>
										<PencilFill className="w-3.5 h-3.5 text-secondary" />
									</Link>
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		);
	}

	return (
		<div data-testid="project-application-list-container" className="mt-9">
			<h2 className="font-semibold text-white text-xl	">
				{t('applications')}
			</h2>
			<div className="custom-card flex flex-col">
				{renderTable()}
				<button
					data-testid="new-application-btn"
					onClick={openAppCreateFlow}
					className="flex gap-2 items-center text-secondary hover:brightness-90"
				>
					<Plus className="text-secondary w-4 h-4 hover:brightness-90" />
					<span>{t('newApplication')}</span>
				</button>
			</div>
			<dialog ref={dialogRef} className="modal">
				<div className="dialog-box border-0 rounded-none">
					<CreateApplication
						onClose={closeAppCreateFlow}
						projectId={projectId}
					/>
				</div>
				<form method="dialog" className="modal-backdrop">
					<button />
				</form>
			</dialog>
		</div>
	);
}

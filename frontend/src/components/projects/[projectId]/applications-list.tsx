import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { PencilFill, Plus } from 'react-bootstrap-icons';
import useSWR from 'swr';

import { handleRetrieveApplications, handleRetrievePromptConfigs } from '@/api';
import { Navigation } from '@/constants';
import { ApiError } from '@/errors';
import {
	useApplications,
	usePromptConfig,
	useSetProjectApplications,
	useSetPromptConfig,
} from '@/stores/project-store';
import { useShowError } from '@/stores/toast-store';
import { populateApplicationId, populateProjectId } from '@/utils/navigation';

export function ApplicationsList({ projectId }: { projectId: string }) {
	const t = useTranslations('projectOverview');
	const applications = useApplications(projectId);
	const setProjectApplications = useSetProjectApplications();

	const promptConfigs = usePromptConfig();
	const setPromptConfig = useSetPromptConfig();

	const showError = useShowError();

	const { isLoading } = useSWR(projectId, handleRetrieveApplications, {
		onSuccess(data) {
			setProjectApplications(projectId, data);
		},
		onError({ message }: ApiError) {
			showError(message);
		},
	});

	useSWR(
		() => applications,
		(applications) =>
			Promise.all(
				applications.map((application) =>
					handleRetrievePromptConfigs({
						projectId,
						applicationId: application.id,
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
						const applicationUrl = populateApplicationId(
							populateProjectId(
								Navigation.Applications,
								projectId,
							),
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
				<button className="flex gap-2 items-center text-secondary hover:brightness-90">
					<Plus className="text-secondary w-4 h-4 hover:brightness-90" />
					<span>{t('newApplication')}</span>
				</button>
			</div>
		</div>
	);
}

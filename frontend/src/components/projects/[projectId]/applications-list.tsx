import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { PencilFill, Plus } from 'react-bootstrap-icons';

import { handleRetrieveApplications, handleRetrievePromptConfigs } from '@/api';
import { Navigation } from '@/constants';
import {
	useApplications,
	usePromptConfig,
	useSetProjectApplications,
	useSetPromptConfig,
} from '@/stores/project-store';
import { populateApplicationId, populateProjectId } from '@/utils/navigation';

export function ApplicationsList({ projectId }: { projectId: string }) {
	const t = useTranslations('projectOverview');
	const setProjectApplications = useSetProjectApplications();
	const applications = useApplications(projectId);
	const setPromptConfig = useSetPromptConfig();
	const promptConfigs = usePromptConfig();

	async function fetchApplications() {
		const applicationsRes = await handleRetrieveApplications(projectId);
		setProjectApplications(projectId, applicationsRes);

		const promptConfigs = await Promise.all(
			applicationsRes.map((application) =>
				handleRetrievePromptConfigs({
					projectId,
					applicationId: application.id,
				}),
			),
		);
		promptConfigs.forEach((promptConfig, index) => {
			setPromptConfig(applicationsRes[index].id, promptConfig);
		});
	}

	useEffect(() => {
		void fetchApplications();
	}, []);

	return (
		<div data-testid="project-application-list-container" className="mt-9">
			<h2 className="font-semibold text-white text-xl	">
				{t('applications')}
			</h2>
			<div className="custom-card">
				<table className="custom-table">
					<thead>
						<tr>
							<th>{t('name')}</th>
							<th>{t('configs')}</th>
							<th>{t('edit')}</th>
						</tr>
					</thead>
					<tbody>
						{applications?.map(({ name, id }) => {
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
				<button className="mt-16 flex gap-2 items-center text-secondary hover:brightness-90">
					<Plus className="text-secondary w-4 h-4 hover:brightness-90" />
					<span>{t('newApplication')}</span>
				</button>
			</div>
		</div>
	);
}

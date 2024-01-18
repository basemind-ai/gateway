import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { PencilFill } from 'react-bootstrap-icons';

import { ApplicationPageTabNames, Navigation } from '@/constants';
import { Application, PromptConfig } from '@/types';
import { setRouteParams } from '@/utils/navigation';

export function ProjectApplicationsListTable({
	applications,
	projectId,
	promptConfigs,
}: {
	applications: Application[];
	projectId: string;
	promptConfigs: Record<string, PromptConfig<any>[] | undefined>;
}) {
	const t = useTranslations('projectOverview');
	const router = useRouter();

	return (
		<table
			className="table mb-16"
			data-testid="project-application-list-table-container"
		>
			<thead>
				<tr>
					<th>{t('name')}</th>
					<th>{t('description')}</th>
					<th>{t('configs')}</th>
					<th>{t('edit')}</th>
				</tr>
			</thead>
			<tbody>
				{applications.map(
					({ name, description, id: applicationId }) => {
						return (
							<tr key={applicationId}>
								<td>
									<button
										data-testid="project-application-list-name-button"
										onClick={() => {
											router.push(
												setRouteParams(
													Navigation.ApplicationDetail,
													{
														applicationId,
														projectId,
													},
												),
											);
										}}
										className="btn-link text-base-content hover:text-accent"
									>
										<span>{name}</span>
									</button>
								</td>
								<td className="max-w-md">
									<span className="text-xs line-clamp-1 hover:line-clamp-none text-info">
										{description}
									</span>
								</td>
								<td
									data-testid={`application-prompt-config-count-${applicationId}`}
								>
									<span className="text-neutral-content">
										{promptConfigs[applicationId]?.length ??
											'0'}
									</span>
								</td>
								<td>
									<button
										data-testid="project-application-list-edit-button"
										onClick={() => {
											router.push(
												setRouteParams(
													Navigation.ApplicationDetail,
													{
														applicationId,
														projectId,
													},
													ApplicationPageTabNames.SETTINGS,
												),
											);
										}}
									>
										<PencilFill className="w-3.5 h-3.5 text-base-content hover:text-accent" />
									</button>
								</td>
							</tr>
						);
					},
				)}
			</tbody>
		</table>
	);
}

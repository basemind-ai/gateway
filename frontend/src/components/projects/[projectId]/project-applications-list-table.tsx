import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { PencilFill } from 'react-bootstrap-icons';

import { Navigation } from '@/constants';
import { Application, PromptConfig } from '@/types';
import { setApplicationId, setProjectId } from '@/utils/navigation';

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
				{applications.map(({ name, id: applicationId }) => {
					const applicationUrl = setApplicationId(
						setProjectId(Navigation.ApplicationDetail, projectId),
						applicationId,
					);
					return (
						<tr key={applicationId}>
							<td>
								<Link
									data-testid="application-name-anchor"
									href={applicationUrl}
								>
									{name}
								</Link>
							</td>
							<td
								data-testid={`application-prompt-config-count-${applicationId}`}
							>
								{promptConfigs[applicationId]?.length}
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

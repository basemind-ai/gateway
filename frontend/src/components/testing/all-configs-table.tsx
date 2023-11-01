import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Search } from 'react-bootstrap-icons';
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
import { populateLink } from '@/utils/navigation';

export function AllConfigsTable({ projectId }: { projectId: string }) {
	const router = useRouter();
	const t = useTranslations('testing');

	const applications = useApplications(projectId);
	const setProjectApplications = useSetProjectApplications();
	const promptConfigs = usePromptConfig();
	const setPromptConfig = useSetPromptConfig();

	const showError = useShowError();

	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const { isValidating: isApplicationLoading, error: isAppsError } = useSWR(
		projectId,
		handleRetrieveApplications,
		{
			onSuccess(data) {
				if (data.length === 0) {
					router.push(
						populateLink(Navigation.TestingNewConfig, projectId),
					);
				}
				setProjectApplications(projectId, data);
			},
			onError({ message }: ApiError) {
				showError(message);
			},
		},
	);

	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const { isValidating: isConfigLoading, error: isConfigError } = useSWR(
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
				if (data.every((innerArray) => innerArray.length === 0)) {
					router.push(
						populateLink(Navigation.TestingNewConfig, projectId),
					);
				}
				data.forEach((promptConfig, index) => {
					setPromptConfig(applications![index].id, promptConfig);
				});
			},
			onError({ message }: ApiError) {
				showError(message);
			},
		},
	);

	if (isApplicationLoading || isConfigLoading) {
		return (
			<div
				className="w-full flex mb-8"
				data-testid="loading-all-configs-table"
			>
				<span className="loading loading-bars mx-auto" />
			</div>
		);
	}
	if (isAppsError || isConfigError) {
		return (
			<div className="w-full flex  mb-8">
				<span className="text-red-500 mx-auto">
					{t('errorLoading')}
				</span>
			</div>
		);
	}
	return (
		<table className="custom-table mb-16" data-testid="all-configs-table">
			<thead>
				<tr>
					<th>{t('name')}</th>
					<th>{t('pick')}</th>
					<th>{t('vendor')}</th>
					<th>{t('model')}</th>
					<th>{t('variables')}</th>
					<th>{t('partOfApplication')}</th>
				</tr>
			</thead>
			<tbody>
				{Object.keys(promptConfigs).flatMap(
					(appId) =>
						promptConfigs[appId]?.map((config) => (
							<tr key={config.id}>
								<td>
									<Link
										href={populateLink(
											Navigation.TestingConfig,
											projectId,
											appId,
											config.id,
										)}
									>
										{config.name}
									</Link>
								</td>
								<td>
									<Link
										href={populateLink(
											Navigation.TestingConfig,
											projectId,
											appId,
											config.id,
										)}
										className="text-secondary"
										data-testid={`${config.id}test-config-button`}
									>
										<Search className="w-3.5 h-3.5 mr-2" />
										{t('test')}
									</Link>
								</td>
								<td>{config.modelVendor}</td>
								<td>{config.modelType}</td>
								<td>
									{config.expectedTemplateVariables.length}
								</td>
								<td>
									{
										applications?.find(
											(app) => app.id === appId,
										)?.name
									}
								</td>
							</tr>
						)),
				)}
			</tbody>
		</table>
	);
}

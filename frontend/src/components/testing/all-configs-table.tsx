import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Search } from 'react-bootstrap-icons';
import useSWR from 'swr';

import { handleRetrievePromptConfigs } from '@/api';
import { Navigation } from '@/constants';
import { ApiError } from '@/errors';
import { usePromptConfigs, useSetPromptConfigs } from '@/stores/api-store';
import { useShowError } from '@/stores/toast-store';
import { Application, PromptConfig } from '@/types';
import { setPathParams } from '@/utils/navigation';

export function AllConfigsTable({
	projectId,
	applications,
	handleNoConfigs,
}: {
	applications: Application[] | undefined;
	handleNoConfigs: () => void;
	projectId: string;
}) {
	const t = useTranslations('promptTesting');
	const promptConfigs = usePromptConfigs();
	const setPromptConfig = useSetPromptConfigs();
	const showError = useShowError();

	const { isValidating: isConfigLoading, error: isConfigError } = useSWR<
		PromptConfig<any>[][],
		ApiError,
		() => Application[] | undefined
	>(
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
			onError({ message }: ApiError) {
				showError(message);
			},
			onSuccess(data) {
				data = data.filter(Boolean);
				if (data.every((innerArray) => innerArray.length === 0)) {
					handleNoConfigs();
				}
				data.forEach((promptConfig, index) => {
					if (applications) {
						setPromptConfig(applications[index].id, promptConfig);
					}
				});
			},
		},
	);

	if (!applications || isConfigLoading) {
		return (
			<div
				className="w-full flex mb-8"
				data-testid="loading-all-configs-table"
			>
				<span className="loading loading-bars mx-auto" />
			</div>
		);
	}

	if (isConfigError) {
		return (
			<div className="w-full flex  mb-8">
				<span className="text-error mx-auto">{t('errorLoading')}</span>
			</div>
		);
	}

	function RenderConfigs() {
		return Object.keys(promptConfigs).flatMap(
			(appId) =>
				promptConfigs[appId]?.map((config) => (
					<tr key={config.id}>
						<td>
							<Link
								href={setPathParams(
									Navigation.PromptConfigDetail,
									{
										applicationId: appId,
										configId: config.id,
										projectId,
									},
								)}
							>
								{config.name}
							</Link>
						</td>
						<td>
							<Link
								href={setPathParams(
									Navigation.PromptConfigDetail,
									{
										applicationId: appId,
										configId: config.id,
										projectId,
									},
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
						<td>{config.expectedTemplateVariables.length}</td>
						<td>
							{
								applications?.find((app) => app.id === appId)
									?.name
							}
						</td>
					</tr>
				)),
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
			<tbody>{RenderConfigs()}</tbody>
		</table>
	);
}

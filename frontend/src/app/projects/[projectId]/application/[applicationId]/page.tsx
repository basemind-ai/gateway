'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import {
	Activity,
	Cash,
	Front,
	PencilFill,
	Plus,
	Search,
} from 'react-bootstrap-icons';
import { DateValueType } from 'react-tailwindcss-datepicker';

import { handleApplicationAnalytics, handleRetrievePromptConfigs } from '@/api';
import { DataCard } from '@/components/dashboard/data-card';
import { DatePicker } from '@/components/dashboard/date-picker';
import { Navigation } from '@/constants';
import { useAuthenticatedUser } from '@/hooks/use-authenticated-user';
import {
	useGetApplication,
	useGetPromptConfig,
	useSetPromptConfig,
} from '@/stores/project-store';
import { ApplicationAnalytics } from '@/types';
import { copyToClipboard } from '@/utils/helpers';

export default function Application({
	params: { projectId, applicationId },
}: {
	params: { projectId: string; applicationId: string };
}) {
	useAuthenticatedUser();
	const t = useTranslations('application');
	const router = useRouter();
	const application = useGetApplication()(projectId, applicationId);

	useEffect(() => {
		if (!application) {
			router.replace(Navigation.Projects);
		}
	}, []);

	if (!application) {
		return null;
	}

	return (
		<div data-testid="application-page" className="my-8 mx-32">
			<h1 className="text-2xl font-semibold text-base-content">
				{t('application')} / {application.name}
			</h1>
			<div className="mt-3.5 h-11 text-xl">Overview(stub)</div>
			<ApplicationAnalytics
				applicationId={applicationId}
				projectId={projectId}
			/>
			<ApplicationPromptConfigs
				applicationId={applicationId}
				projectId={projectId}
			/>
		</div>
	);
}

export function ApplicationAnalytics({
	projectId,
	applicationId,
}: {
	projectId: string;
	applicationId: string;
}) {
	const t = useTranslations('application');

	const oneWeekAgo = new Date();
	oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

	const [dateRange, setDateRange] = useState<DateValueType>({
		startDate: oneWeekAgo,
		endDate: new Date(),
	});

	const [analytics, setAnalytics] = useState<ApplicationAnalytics | null>(
		null,
	);

	useEffect(() => {
		(async () => {
			const applicationAnalytics = await handleApplicationAnalytics({
				applicationId,
				projectId,
				fromDate: dateRange?.startDate,
				toDate: dateRange?.endDate,
			});
			setAnalytics(applicationAnalytics);
		})();
	}, [dateRange]);

	return (
		<div className="mt-9">
			<div className="flex justify-between items-center">
				<h2 className="font-semibold text-white text-xl	">
					{t('status')}
				</h2>
				<DatePicker
					displayFormat="DD/MM/YYYY"
					showShortcuts={true}
					useRange={true}
					value={dateRange}
					onValueChange={setDateRange}
				/>
			</div>
			<div className="mt-3.5 rounded-3xl w-full flex items-center justify-between bg-base-200 py-8 px-32">
				<DataCard
					imageSrc={<Activity className="text-secondary w-6 h-6" />}
					metric={t('apiCalls')}
					totalValue={analytics?.totalRequests ?? ''}
				/>
				<div className="w-px h-12 bg-gray-200 mx-4"></div>
				<DataCard
					imageSrc={<Cash className="text-secondary w-6 h-6" />}
					metric={t('modelsCost')}
					totalValue={`${analytics?.projectedCost ?? ''}$`}
				/>
			</div>
		</div>
	);
}

export function ApplicationPromptConfigs({
	projectId,
	applicationId,
}: {
	projectId: string;
	applicationId: string;
}) {
	const t = useTranslations('application');
	const setPromptConfig = useSetPromptConfig();
	const promptConfigs = useGetPromptConfig();

	async function fetchPromptConfig() {
		const promptConfigRes = await handleRetrievePromptConfigs({
			applicationId,
			projectId,
		});
		setPromptConfig(applicationId, promptConfigRes);
	}

	useEffect(() => {
		void fetchPromptConfig();
	}, []);

	return (
		<div className="mt-9">
			<h2 className="font-semibold text-white text-xl	">
				{t('promptConfiguration')}
			</h2>
			<div className="mt-3.5 rounded-3xl w-full  bg-base-200 py-8 px-16">
				<table className="custom-table">
					<thead>
						<tr>
							<th>{t('name')}</th>
							<th>{t('type')}</th>
							<th>{t('model')}</th>
							<th>ID</th>
							<th>{t('test')}</th>
							<th>{t('edit')}</th>
						</tr>
					</thead>
					<tbody>
						{promptConfigs[applicationId]?.map(
							({ name, modelType, modelVendor, id }) => (
								<tr key={id}>
									<td>{name}</td>
									<td>{modelType}</td>
									<td>{modelVendor}</td>
									<td>
										<button
											data-testid="prompt-config-copy-btn"
											onClick={() => {
												copyToClipboard(id);
												// TODO: add a toast
											}}
										>
											<Front className="w-3.5 h-3.5 text-secondary" />
										</button>
									</td>
									<td>
										<button>
											<Search className="w-3.5 h-3.5 text-secondary" />
										</button>
									</td>
									<td>
										<button>
											<PencilFill className="w-3.5 h-3.5 text-secondary" />
										</button>
									</td>
								</tr>
							),
						)}
					</tbody>
				</table>
				<button className="mt-16 flex gap-2 items-center text-secondary hover:brightness-90">
					<Plus className="text-secondary w-4 h-4 hover:brightness-90" />
					<span>{t('newConfiguration')}</span>
				</button>
			</div>
		</div>
	);
}

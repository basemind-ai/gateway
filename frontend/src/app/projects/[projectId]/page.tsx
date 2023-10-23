'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import {
	Activity,
	Cash,
	Gear,
	PencilFill,
	Plus,
	Speedometer2,
} from 'react-bootstrap-icons';
import { DateValueType } from 'react-tailwindcss-datepicker';

import {
	handleProjectAnalytics,
	handleRetrieveApplications,
	handleRetrievePromptConfigs,
} from '@/api';
import { DataCard } from '@/components/dashboard/data-card';
import { DatePicker } from '@/components/dashboard/date-picker';
import { TabData, TabNavigation } from '@/components/tab-navigation';
import { Navigation } from '@/constants';
import { useAuthenticatedUser } from '@/hooks/use-authenticated-user';
import { useProjectBootstrap } from '@/hooks/use-project-bootstrap';
import {
	useApplications,
	useProject,
	usePromptConfig,
	useSetProjectApplications,
	useSetPromptConfig,
} from '@/stores/project-store';
import { useDateFormat } from '@/stores/user-config-store';
import { ProjectAnalytics } from '@/types';
import { populateApplicationId, populateProjectId } from '@/utils/navigation';

enum TAB_NAMES {
	OVERVIEW,
	MEMBERS,
	BILLING,
	SETTINGS,
}

export default function ProjectOverview({
	params: { projectId },
}: {
	params: { projectId: string };
}) {
	useAuthenticatedUser();
	useProjectBootstrap();
	const t = useTranslations('projectOverview');
	const project = useProject(projectId);

	const tabs: TabData<TAB_NAMES>[] = [
		{
			id: TAB_NAMES.OVERVIEW,
			text: t('overview'),
			icon: <Speedometer2 className="w-3.5 h-3.5" />,
		},
		{
			id: TAB_NAMES.MEMBERS,
			text: t('members'),
			icon: <Gear className="w-3.5 h-3.5" />,
		},
		{
			id: TAB_NAMES.BILLING,
			text: t('billing'),
			icon: <Gear className="w-3.5 h-3.5" />,
		},
		{
			id: TAB_NAMES.SETTINGS,
			text: t('settings'),
			icon: <Gear className="w-3.5 h-3.5" />,
		},
	];
	const [selectedTab, setSelectedTab] = useState(TAB_NAMES.OVERVIEW);

	if (!project) {
		return null;
	}

	return (
		<div data-testid="project-page" className="my-8 mx-32">
			<h1
				data-testid="project-page-title"
				className="text-2xl font-semibold text-base-content"
			>
				{project.name}
			</h1>
			<div className="mt-3.5 w-full mb-9">
				<TabNavigation<TAB_NAMES>
					tabs={tabs}
					selectedTab={selectedTab}
					onTabChange={setSelectedTab}
					trailingLine={true}
				/>
			</div>
			{selectedTab === TAB_NAMES.OVERVIEW && (
				<>
					<ProjectAnalytics projectId={projectId} />
					<ApplicationsList projectId={projectId} />
				</>
			)}
			{selectedTab === TAB_NAMES.SETTINGS && <>sdsd</>}
		</div>
	);
}

export function ProjectAnalytics({ projectId }: { projectId: string }) {
	const t = useTranslations('projectOverview');
	const dateFormat = useDateFormat();

	const oneWeekAgo = new Date();
	oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

	const [dateRange, setDateRange] = useState<DateValueType>({
		startDate: oneWeekAgo,
		endDate: new Date(),
	});

	const [analytics, setAnalytics] = useState<ProjectAnalytics | null>(null);

	useEffect(() => {
		(async () => {
			const applicationAnalytics = await handleProjectAnalytics({
				projectId,
				fromDate: dateRange?.startDate,
				toDate: dateRange?.endDate,
			});
			setAnalytics(applicationAnalytics);
		})();
	}, [dateRange]);

	return (
		<div data-testid="project-analytics-container">
			<div className="flex justify-between items-center">
				<h2 className="font-semibold text-white text-xl">
					{t('status')}
				</h2>
				<DatePicker
					displayFormat={dateFormat}
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
					totalValue={analytics?.totalAPICalls ?? ''}
					percentage={'100'}
					currentValue={'324'}
				/>
				<div className="w-px h-12 bg-gray-200 mx-4" />
				<DataCard
					imageSrc={<Cash className="text-secondary w-6 h-6" />}
					metric={t('modelsCost')}
					totalValue={`${analytics?.modelsCost ?? ''}$`}
					percentage={'103'}
					currentValue={'3.3'}
				/>
			</div>
		</div>
	);
}

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
			<div className="mt-3.5 rounded-3xl w-full bg-base-200 py-8 px-16">
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
									Navigation.Application,
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

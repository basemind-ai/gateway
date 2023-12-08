import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Activity, Cash } from 'react-bootstrap-icons';
import { DateValueType } from 'react-tailwindcss-datepicker';
import useSWR from 'swr';

import { handleProjectAnalytics } from '@/api';
import { DataCard } from '@/components/data-card';
import { DatePicker } from '@/components/date-picker';
import { useHandleError } from '@/hooks/use-handle-error';
import { usePageTracking } from '@/hooks/use-page-tracking';
import { useDateFormat } from '@/stores/user-config-store';
import { Project } from '@/types';

export function ProjectAnalytics({ project }: { project: Project }) {
	const t = useTranslations('projectOverview');
	usePageTracking('project-overview');

	const dateFormat = useDateFormat();
	const handleError = useHandleError();

	const oneWeekAgo = dayjs().subtract(7, 'days').toDate();
	const [dateRange, setDateRange] = useState<DateValueType>({
		endDate: new Date(),
		startDate: oneWeekAgo,
	});

	const { data: analytics, isLoading } = useSWR(
		{
			fromDate: dateRange?.startDate,
			projectId: project.id,
			toDate: dateRange?.endDate,
		},
		handleProjectAnalytics,
		{
			onError: handleError,
		},
	);

	return (
		<div data-testid="project-analytics-container">
			<div className="flex justify-between items-center">
				<h2 className="card-header">{t('status')}</h2>
				<DatePicker
					displayFormat={dateFormat}
					showShortcuts={true}
					useRange={true}
					value={dateRange}
					onValueChange={setDateRange}
				/>
			</div>
			<div className="analytics">
				<DataCard
					imageSrc={<Activity className="text-secondary w-6 h-6" />}
					metric={t('apiCalls')}
					totalValue={analytics?.totalRequests ?? ''}
					loading={isLoading}
				/>
				<div className="w-px h-12 bg-gray-200 mx-4" />
				<DataCard
					imageSrc={<Cash className="text-secondary w-6 h-6" />}
					metric={t('modelsCost')}
					totalValue={`${analytics?.tokensCost ?? ''}$`}
					loading={isLoading}
				/>
			</div>
		</div>
	);
}

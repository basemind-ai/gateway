import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Activity, Cash } from 'react-bootstrap-icons';
import { DateValueType } from 'react-tailwindcss-datepicker';
import useSWR from 'swr';

import { handleProjectAnalytics } from '@/api';
import { DataCard } from '@/components/data-card';
import { DatePicker } from '@/components/date-picker';
import { ApiError } from '@/errors';
import { useShowError } from '@/stores/toast-store';
import { useDateFormat } from '@/stores/user-config-store';
import { Project } from '@/types';

export function ProjectAnalytics({ project }: { project: Project }) {
	const t = useTranslations('projectOverview');
	const dateFormat = useDateFormat();
	const showError = useShowError();

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
			/* c8 ignore start */
			onError({ message }: ApiError) {
				showError(message);
			},
			/* c8 ignore end */
		},
	);

	return (
		<div data-testid="project-analytics-container">
			<div className="flex justify-between items-center">
				<h2 className="card-header-right self-end">{t('status')}</h2>
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

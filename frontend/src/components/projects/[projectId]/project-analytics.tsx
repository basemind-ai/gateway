import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Activity, Cash } from 'react-bootstrap-icons';
import { DateValueType } from 'react-tailwindcss-datepicker';
import useSWR from 'swr';

import { handleProjectAnalytics } from '@/api';
import { DataCard } from '@/components/dashboard/data-card';
import { DatePicker } from '@/components/dashboard/date-picker';
import { ApiError } from '@/errors';
import { useShowError } from '@/stores/toast-store';
import { useDateFormat } from '@/stores/user-config-store';

export function ProjectAnalytics({ projectId }: { projectId: string }) {
	const t = useTranslations('projectOverview');
	const dateFormat = useDateFormat();
	const showError = useShowError();

	const oneWeekAgo = new Date();
	oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
	const [dateRange, setDateRange] = useState<DateValueType>({
		startDate: oneWeekAgo,
		endDate: new Date(),
	});

	const { data: analytics, isLoading } = useSWR(
		{
			projectId,
			fromDate: dateRange?.startDate,
			toDate: dateRange?.endDate,
		},
		handleProjectAnalytics,
		{
			onError({ message }: ApiError) {
				showError(message);
			},
		},
	);

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
			<div className="flex items-center justify-between custom-card">
				<DataCard
					imageSrc={<Activity className="text-secondary w-6 h-6" />}
					metric={t('apiCalls')}
					totalValue={analytics?.totalAPICalls ?? ''}
					percentage={'100'}
					currentValue={'324'}
					loading={isLoading}
				/>
				<div className="w-px h-12 bg-gray-200 mx-4" />
				<DataCard
					imageSrc={<Cash className="text-secondary w-6 h-6" />}
					metric={t('modelsCost')}
					totalValue={`${analytics?.modelsCost ?? ''}$`}
					percentage={'103'}
					currentValue={'3.3'}
					loading={isLoading}
				/>
			</div>
		</div>
	);
}

import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Activity, Cash } from 'react-bootstrap-icons';
import { DateValueType } from 'react-tailwindcss-datepicker';
import useSWR from 'swr';

import { handlePromptConfigAnalytics } from '@/api';
import { DataCard } from '@/components/data-card';
import { DatePicker } from '@/components/date-picker';
import { useHandleError } from '@/hooks/use-handle-error';
import { useDateFormat } from '@/stores/user-config-store';
import { PromptConfig } from '@/types';

export function PromptConfigAnalyticsPage({
	projectId,
	applicationId,
	promptConfig,
}: {
	applicationId: string;
	projectId: string;
	promptConfig: PromptConfig<any>;
}) {
	const t = useTranslations('promptConfig');
	const dateFormat = useDateFormat();
	const handleError = useHandleError();

	const oneWeekAgo = dayjs().subtract(7, 'days').toDate();

	const [dateRange, setDateRange] = useState<DateValueType>({
		endDate: new Date(),
		startDate: oneWeekAgo,
	});

	const { data: analytics, isLoading } = useSWR(
		{
			applicationId,
			fromDate: dateRange?.startDate,
			projectId,
			promptConfigId: promptConfig.id,
			toDate: dateRange?.endDate,
		},
		handlePromptConfigAnalytics,
		{
			onError: handleError,
		},
	);

	return (
		<div data-testid="prompt-analytics-container">
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
					totalValue={analytics?.totalRequests ?? '0'}
					loading={isLoading}
				/>
				<div className="w-px h-12 bg-gray-200 mx-4" />
				<DataCard
					imageSrc={<Cash className="text-secondary w-6 h-6" />}
					metric={t('modelsCost')}
					totalValue={`${analytics?.tokensCost ?? '0'}$`}
					loading={isLoading}
				/>
			</div>
		</div>
	);
}

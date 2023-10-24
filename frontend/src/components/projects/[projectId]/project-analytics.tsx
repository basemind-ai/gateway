import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Activity, Cash } from 'react-bootstrap-icons';
import { DateValueType } from 'react-tailwindcss-datepicker';

import { handleProjectAnalytics } from '@/api';
import { DataCard } from '@/components/dashboard/data-card';
import { DatePicker } from '@/components/dashboard/date-picker';
import { useDateFormat } from '@/stores/user-config-store';
import { ProjectAnalytics } from '@/types';

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

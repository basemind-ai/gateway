import { UserInfo } from '@firebase/auth';
import { useTranslations } from 'next-intl';

import DashboardCard from '@/components/dashboard/dashboard-card';
import { UserInfoRow } from '@/components/settings/user-info-row';

export function UserDetails({ user }: { user: UserInfo | null }) {
	const t = useTranslations('userSettings');
	return (
		<DashboardCard title={t('headlineDetailsCard')}>
			{user?.photoURL ? (
				<img
					src={user.photoURL}
					alt={t('profilePicture')}
					className="rounded-full w-48 h-14"
				/>
			) : (
				<div className="rounded-full w-14 h-14 bg-neutral animate-pulse" />
			)}
			<UserInfoRow label={t('fullName')} value={user?.displayName} />
			<UserInfoRow label={t('email')} value={user?.email} />
		</DashboardCard>
	);
}

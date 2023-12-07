import { UserInfo } from '@firebase/auth';
import { useTranslations } from 'next-intl';

import { DashboardCard } from '@/components/dashboard-card';
import { UserInfoRow } from '@/components/settings/user-info-row';
import { defaultProfilePicture } from '@/constants';

export function UserDetails({ user }: { user: UserInfo | null }) {
	const t = useTranslations('userSettings');
	return (
		<DashboardCard title={t('headlineDetailsCard')}>
			<img
				src={user?.photoURL ?? defaultProfilePicture}
				alt={t('profilePicture')}
				className="rounded-full w-14 h-14"
			/>

			<UserInfoRow label={t('fullName')} value={user?.displayName} />
			<UserInfoRow label={t('email')} value={user?.email} />
		</DashboardCard>
	);
}

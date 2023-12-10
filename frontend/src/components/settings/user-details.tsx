import { UserInfo } from '@firebase/auth';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { DashboardCard } from '@/components/dashboard-card';
import { UserInfoRow } from '@/components/settings/user-info-row';
import { defaultProfilePicture, Dimensions } from '@/constants';

export function UserDetails({ user }: { user: UserInfo | null }) {
	const t = useTranslations('userSettings');
	return (
		<DashboardCard title={t('headlineDetailsCard')}>
			<Image
				src={user?.photoURL ?? defaultProfilePicture}
				alt={t('profilePicture')}
				className="rounded-full"
				width={Dimensions.Fourteen}
				height={Dimensions.Fourteen}
			/>
			<UserInfoRow label={t('fullName')} value={user?.displayName} />
			<UserInfoRow label={t('email')} value={user?.email} />
		</DashboardCard>
	);
}

import { UserInfo } from '@firebase/auth';
import { useTranslations } from 'next-intl';

import DashboardCard from '@/components/dashboard/dashboard-card';

export function UserDetails({ user }: { user: UserInfo | null }) {
	const t = useTranslations('userSettings');
	return (
		<DashboardCard title={t('headlineDetailsCard')}>
			{user?.photoURL ? (
				// eslint-disable-next-line @next/next/no-img-element
				<img
					src={user.photoURL}
					alt={t('profilePicture')}
					className="rounded-full w-14 h-14"
				/>
			) : (
				<div className="rounded-full w-14 h-14 bg-neutral animate-pulse" />
			)}
			<div className="my-auto">
				<div className="text-neutral-content text-xs font-medium mb-1">
					{t('fullName')}
				</div>

				<div
					className={`text-neutral-content text-lg font-medium ${
						!user?.displayName && 'animate-pulse w-24 bg-neutral'
					}`}
					data-testid="user-name"
				>
					{user?.displayName ?? '\u00A0'}
				</div>
			</div>
			<div className="my-auto">
				<div className="text-neutral-content text-xs font-medium mb-1">
					{t('email')}
				</div>

				<div
					className={`text-neutral-content text-lg font-medium ${
						!user?.email && 'animate-pulse w-48 bg-neutral'
					}`}
					data-testid="user-email"
				>
					{user?.email ?? '\u00A0'}
				</div>
			</div>
		</DashboardCard>
	);
}

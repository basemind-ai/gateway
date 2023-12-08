'use client';
import { useTranslations } from 'next-intl';

import { Navbar } from '@/components/navbar';
import { DeleteAccountView } from '@/components/settings/delete-account-view';
import { UserDetails } from '@/components/settings/user-details';
import { useAuthenticatedUser } from '@/hooks/use-authenticated-user';
import { usePageTracking } from '@/hooks/use-page-tracking';

export default function UserSettings() {
	const user = useAuthenticatedUser();
	const t = useTranslations('userSettings');
	usePageTracking('user-settings');

	return (
		<div
			data-testid="user-settings-page"
			className="flex flex-col min-h-screen w-full bg-base-100"
		>
			<div className="page-content-container">
				<Navbar
					headline={t('headline')}
					userPhotoURL={user?.photoURL}
				/>
				<div className="card-divider" />

				<UserDetails user={user} />
				<div className="card-divider">
					<DeleteAccountView user={user} />
				</div>
			</div>
		</div>
	);
}

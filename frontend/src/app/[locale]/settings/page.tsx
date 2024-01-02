'use client';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

import { Navbar } from '@/components/navbar';
import { DeleteAccountView } from '@/components/settings/delete-account-view';
import { UserDetails } from '@/components/settings/user-details';
import { useAnalytics } from '@/hooks/use-analytics';
import { useAuthenticatedUser } from '@/hooks/use-authenticated-user';

export default function UserSettings() {
	const user = useAuthenticatedUser();
	const t = useTranslations('userSettings');

	const { initialized, page } = useAnalytics();
	useEffect(() => {
		if (initialized) {
			page('user-settings');
		}
	}, [initialized]);

	return (
		<main
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
		</main>
	);
}

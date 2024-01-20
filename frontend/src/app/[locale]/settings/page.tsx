'use client';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

import { Navbar } from '@/components/navbar';
import { DeleteAccountView } from '@/components/settings/delete-account-view';
import { UserDetails } from '@/components/settings/user-details';
import { PageNames } from '@/constants/analytics';
import { useAnalytics } from '@/hooks/use-analytics';
import { useAuthenticatedUser } from '@/hooks/use-authenticated-user';

export default function UserSettings() {
	const user = useAuthenticatedUser();
	const t = useTranslations('userSettings');

	const { initialized, page, identify } = useAnalytics();

	useEffect(() => {
		if (initialized) {
			page(PageNames.UserSettings);
			if (user) {
				identify(user.uid, {
					avatar: user.photoURL,
					email: user.email,
					id: user.uid,
					name: user.displayName,
				});
			}
		}
	}, [identify, initialized, page, user]);

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

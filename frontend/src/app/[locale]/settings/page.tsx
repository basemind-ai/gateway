'use client';
import { useTranslations } from 'next-intl';

import { Navbar } from '@/components/navbar';
import { DeleteAccountView } from '@/components/settings/delete-account-view';
import { UserDetails } from '@/components/settings/user-details';
import { useAuthenticatedUser } from '@/hooks/use-authenticated-user';

export default function UserSettings() {
	const user = useAuthenticatedUser()!;
	const t = useTranslations('userSettings');

	return (
		<div
			data-testid="user-settings-page"
			className="flex flex-col min-h-screen w-full bg-base-100"
		>
			<Navbar headline={t('headline')} />
			<div className="mx-auto max-w-screen-lg container">
				<div className="card-divider">
					<UserDetails user={user} />
				</div>
				<div className="card-divider">
					<DeleteAccountView user={user} />
				</div>
			</div>
		</div>
	);
}

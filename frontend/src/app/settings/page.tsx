'use client';

import { useTranslations } from 'next-intl';

import { DeleteAccountView } from '@/components/settings/delete-account-view';
import { UserDetails } from '@/components/settings/user-details';
import { useAuthenticatedUser } from '@/hooks/use-authenticated-user';

export default function UserSettings() {
	const user = useAuthenticatedUser();
	const t = useTranslations('userSettings');

	return (
		<div data-testid="user-settings-page" className="mt-6 mx-32">
			<h1 className="text-2xl font-semibold text-base-content mb-10">
				{t('headline')}
			</h1>
			<div className="mb-10">
				<UserDetails user={user} />
			</div>
			<DeleteAccountView user={user} />
		</div>
	);
}

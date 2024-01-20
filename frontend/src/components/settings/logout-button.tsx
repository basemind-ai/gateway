import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { TrackEvents } from '@/constants/analytics';
import { useAnalytics } from '@/hooks/use-analytics';
import { useSetUser } from '@/stores/api-store';
import { getFirebaseAuth } from '@/utils/firebase';

export function LogoutButton() {
	const t = useTranslations('navbar');
	const { initialized, track } = useAnalytics();
	const router = useRouter();
	const setUser = useSetUser();

	async function handleLogout() {
		const auth = await getFirebaseAuth();
		if (initialized) {
			track(TrackEvents.SignedOut);
		}
		await auth.signOut();
		setUser(null);
		router.replace('/');
	}

	return (
		<button
			onClick={() => {
				void handleLogout();
			}}
			data-testid="dashboard-logout-btn"
			className="link-error px-2"
		>
			{t('logout')}
		</button>
	);
}

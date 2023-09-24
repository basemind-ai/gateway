import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { getFirebaseAuth } from '@/utils/firebase';

export function LogoutButton() {
	const t = useTranslations('common');
	const router = useRouter();

	async function handleLogout() {
		const auth = await getFirebaseAuth();
		await auth.signOut();
		router.replace('/');
	}

	return (
		<button
			onClick={() => {
				void handleLogout();
			}}
			data-testid="dashboard-logout-btn"
		>
			{t('logout')}
		</button>
	);
}

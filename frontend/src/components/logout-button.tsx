import { useRouter } from 'next/navigation';
import useTranslation from 'next-translate/useTranslation';

import { getFirebaseAuth } from '@/utils/firebase';

export function LogoutButton() {
	const { t } = useTranslation('common');
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

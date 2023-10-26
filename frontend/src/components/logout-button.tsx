import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { useSetUser } from '@/stores/api-store';
import { getFirebaseAuth } from '@/utils/firebase';

export function LogoutButton() {
	const t = useTranslations('common');
	const router = useRouter();
	const setUser = useSetUser();

	async function handleLogout() {
		const auth = await getFirebaseAuth();
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
			className="btn btn-sm btn-outline btn-accent"
		>
			{t('logout')}
		</button>
	);
}

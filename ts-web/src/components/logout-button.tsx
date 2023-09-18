'use client';
import { useRouter } from 'next/navigation';

import { getFirebaseAuth } from '@/utils/firebase';

export function LogoutButton() {
	const router = useRouter();

	async function logout() {
		const auth = await getFirebaseAuth();
		await auth.signOut();
		router.replace('/');
	}

	return (
		<button
			onClick={() => {
				void logout();
			}}
			data-testid="dashboard-logout-btn"
		>
			LOGOUT
		</button>
	);
}

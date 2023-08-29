'use client';

import { useRouter } from 'next/navigation';

import { useUser } from '@/stores/user-store';
import { getFirebaseAuth } from '@/utils/firebase';

export default function Dashboard() {
	const user = useUser();
	const router = useRouter();

	if (!user) {
		router.replace('/');
		return;
	}

	async function logout() {
		const auth = await getFirebaseAuth();
		await auth.signOut();
		router.replace('/');
	}

	return (
		<div>
			<h1 data-testid="dashboard-display-name">
				Username: {user.displayName}
			</h1>
			<button
				data-testid="dashboard-logout-btn"
				onClick={() => void logout()}
			>
				Logout
			</button>
		</div>
	);
}

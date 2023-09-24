'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { Navigation } from '@/constants';
import { useSetUser } from '@/stores/api-store';
import { getFirebaseAuth } from '@/utils/firebase';

export default function AuthInitialCheck() {
	const router = useRouter();
	const setUser = useSetUser();

	useEffect(() => {
		(async () => {
			const auth = await getFirebaseAuth();
			if (auth.currentUser) {
				setUser(auth.currentUser);
				router.replace(Navigation.Projects);
			} else {
				router.replace(Navigation.SignIn);
			}
		})();
	}, []);

	return null;
}

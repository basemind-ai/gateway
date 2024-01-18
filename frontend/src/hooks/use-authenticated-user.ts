import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { Navigation } from '@/constants';
import { useSetUser, useUser } from '@/stores/api-store';
import { getFirebaseAuth } from '@/utils/firebase';

export function useAuthenticatedUser() {
	const user = useUser();
	const router = useRouter();
	const setUser = useSetUser();

	useEffect(() => {
		if (!user) {
			(async () => {
				const auth = await getFirebaseAuth();
				if (auth.currentUser) {
					setUser(auth.currentUser);
				} else {
					router.replace(Navigation.SignIn);
				}
			})();
		}
	});

	return user;
}

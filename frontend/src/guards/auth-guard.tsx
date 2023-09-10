'use client';

import { useRouter } from 'next/navigation';

import { Navigation } from '@/constants';
import { useUser } from '@/stores/api-store';

export default function AuthGuard() {
	const user = useUser();
	const router = useRouter();

	if (!user) {
		router.replace(Navigation.SignIn);
		return;
	}
	return <></>;
}

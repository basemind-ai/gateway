'use client';

import { useRouter } from 'next/navigation';

import { useUser } from '@/stores/user-store';

export default function APISetup() {
	const user = useUser();
	const router = useRouter();

	if (!user) {
		router.replace('/');
		return;
	}

	return <div>test2</div>;
}

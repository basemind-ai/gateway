'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

import { Loader } from '@/components/loader';
import { Navigation } from '@/constants';
import { useAuthenticatedUser } from '@/hooks/use-authenticated-user';

export default function Home() {
	const user = useAuthenticatedUser();
	const router = useRouter();
	const t = useTranslations('common');

	useEffect(() => {
		if (user) {
			router.replace(Navigation.Projects);
		}
	}, [user]);

	return (
		<main className="h-full w-full flex items-center justify-center bg-base-100">
			{!user && (
				<Link data-testid="sign-in-link" href={Navigation.SignIn}>
					{t('signIn')}
				</Link>
			)}
			{user && <Loader />}
		</main>
	);
}

'use client';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Navigation } from '@/constants';
import AuthInitialCheck from '@/guards/auth-inital-check';

export default function Home() {
	const t = useTranslations('common');
	return (
		<>
			<AuthInitialCheck />
			<main className="h-full w-full flex items-center justify-center bg-base-100">
				<Link data-testid="sign-in-link" href={Navigation.SignIn}>
					{t('signIn')}
				</Link>
			</main>
		</>
	);
}
